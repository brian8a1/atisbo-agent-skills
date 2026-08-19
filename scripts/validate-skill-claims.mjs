#!/usr/bin/env node
/**
 * validate-skill-claims.mjs — check that what the skills TELL AN AGENT TO DO exists.
 *
 * Why this file exists: on 2026-08-19, three separate instructions in this repo pointed at
 * things that were not there.
 *   - `agent-dispatch` opened with `atisbo_lookup mode=dispatch_queue`. ADR-153 had folded
 *     that mode into `work_queue`; the product fixed its own copy of the claim (#325) and
 *     guarded it (#326) — but that guard reads the product's TOOL_REGISTRY, and skills live
 *     here. The first step of the skill that hands work to coding agents had been failing Zod
 *     validation ever since, in the client, leaving no trace in any table we own.
 *   - The installer printed "set SENSO_MCP_KEY" while .mcp.json reads ATISBO_MCP_KEY: 401.
 *   - The README told Codex and Cursor users to run `node claude-plugin/scripts/…`, a path
 *     from a layout this repo does not have.
 *
 * All three share a shape: prose that instructs, verified by nothing. A skill cannot fail a
 * type check. This is the smallest thing that makes these claims falsifiable.
 *
 * Usage:  node scripts/validate-skill-claims.mjs
 * Exit 1 on any broken claim.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const checked = { modes: 0, paths: 0, envVars: 0, files: 0 };

// ── inputs ────────────────────────────────────────────────────────────────────
const contract = JSON.parse(readFileSync(join(root, 'contracts/mcp-modes.json'), 'utf8'));
const KNOWN_MODES = contract.modes;
const ALIASES = KNOWN_MODES._aliases ?? {};

/** Every markdown file that instructs somebody: skills + README. */
function instructionFiles() {
  const files = [join(root, 'README.md')];
  const skillsDir = join(root, 'skills');
  for (const skill of readdirSync(skillsDir)) {
    const p = join(skillsDir, skill, 'SKILL.md');
    if (existsSync(p)) files.push(p);
  }
  return files;
}

const rel = (p) => p.slice(root.length + 1);

// ── check 1: every mode=X attributed to a tool must exist in that tool's enum ──
// Matches `atisbo_lookup` … `mode=work_queue` and `mode: work_queue` within the same
// sentence-ish window, which is how these skills actually write it.
function checkModes(file, text) {
  const toolNames = Object.keys(KNOWN_MODES).filter((k) => k !== '_aliases');
  const lines = text.split('\n');

  lines.forEach((line, i) => {
    // find every mode token on the line, with its position
    const modeTokens = [...line.matchAll(/`?mode[=:]\s*`?([a-z_]+)`?/g)];
    if (modeTokens.length === 0) return;

    // Every tool mention on the line, with its position. A line often names two
    // ("read atisbo_lookup mode=X, then dispatch with atisbo_decide mode=Y"), so a
    // mode belongs to the NEAREST tool to its left — not the first one on the line.
    // Getting this wrong produces false positives, and a guard that cries wolf is
    // ignored within a week.
    const mentions = toolNames
      .flatMap((t) => [...line.matchAll(new RegExp(t, 'g'))].map((m) => ({ tool: t, at: m.index })))
      .sort((a, b) => a.at - b.at);

    for (const token of modeTokens) {
      const [, mode] = token;
      const left = mentions.filter((m) => m.at < token.index).at(-1);
      let tool = left?.tool;
      if (!tool) {
        // nothing to the left on this line — fall back to the last tool named above
        for (let back = 1; back <= 3 && !tool; back += 1) {
          const prev = lines[i - back] ?? '';
          const prevMentions = toolNames
            .flatMap((t) => [...prev.matchAll(new RegExp(t, 'g'))].map((m) => ({ tool: t, at: m.index })))
            .sort((a, b) => a.at - b.at);
          tool = prevMentions.at(-1)?.tool;
        }
      }
      if (!tool) continue; // unattributed mention — cannot verify, do not guess

      checked.modes += 1;
      const valid = KNOWN_MODES[tool] ?? [];
      const aliased = ALIASES[tool]?.[mode];
      if (!valid.includes(mode) && !aliased) {
        problems.push(
          `${rel(file)}:${i + 1} — ${tool} has no mode "${mode}". `
          + `Valid: ${valid.join(', ')}`,
        );
      }
    }
  });
}

// ── check 2: every repo-relative path in a command must exist ─────────────────
function checkPaths(file, text) {
  // `node scripts/foo.mjs`, `--plugin-dir ./x`, `./skills/y/SKILL.md`
  const candidates = [
    ...text.matchAll(/node\s+([\w./-]+\.mjs)/g),
    ...text.matchAll(/--plugin-dir\s+([\w./-]+)/g),
    ...text.matchAll(/`(\.\/[\w./-]+)`/g),
  ];
  for (const [, raw] of candidates) {
    const p = raw.replace(/^\.\//, '');
    if (p === '.' || p === '') continue;
    checked.paths += 1;
    if (!existsSync(join(root, p))) {
      problems.push(`${rel(file)} — path does not exist in this repo: ${raw}`);
    }
  }
}

// ── check 3: env vars named in prose must match .mcp.json ─────────────────────
function checkEnvVars() {
  const mcp = readFileSync(join(root, '.mcp.json'), 'utf8');
  const declared = new Set([...mcp.matchAll(/\$\{([A-Z0-9_]+)\}/g)].map((m) => m[1]));
  if (declared.size === 0) return;

  const scriptText = readFileSync(join(root, 'scripts/install-agent-skills.mjs'), 'utf8');
  const files = [...instructionFiles(), join(root, 'scripts/install-agent-skills.mjs')];

  for (const file of files) {
    const text = file.endsWith('.mjs') ? scriptText : readFileSync(file, 'utf8');
    for (const [, name] of text.matchAll(/\b([A-Z][A-Z0-9]*_MCP_KEY)\b/g)) {
      checked.envVars += 1;
      if (!declared.has(name)) {
        problems.push(
          `${rel(file)} — instructs setting ${name}, but .mcp.json reads `
          + `${[...declared].join(', ')}`,
        );
      }
    }
  }
}

// ── check 4: every skill has the frontmatter the loader needs ────────────────
function checkFrontmatter(file, text) {
  if (!file.endsWith('SKILL.md')) return;
  checked.files += 1;
  if (!text.startsWith('---\n')) {
    problems.push(`${rel(file)} — missing frontmatter block`);
    return;
  }
  const fm = text.slice(4, text.indexOf('\n---', 4));
  for (const key of ['name:', 'description:']) {
    if (!fm.includes(key)) problems.push(`${rel(file)} — frontmatter missing ${key}`);
  }
  const dirName = file.split('/').at(-2);
  const nameLine = fm.split('\n').find((l) => l.startsWith('name:'));
  const declaredName = nameLine?.slice(5).trim();
  if (declaredName && declaredName !== dirName) {
    problems.push(`${rel(file)} — frontmatter name "${declaredName}" ≠ directory "${dirName}"`);
  }
}

// ── run ───────────────────────────────────────────────────────────────────────
for (const file of instructionFiles()) {
  const text = readFileSync(file, 'utf8');
  checkModes(file, text);
  checkPaths(file, text);
  checkFrontmatter(file, text);
}
checkEnvVars();

const contractAge = Math.round(
  (Date.now() - new Date(contract.generated_at).getTime()) / 86400000,
);
if (Number.isFinite(contractAge) && contractAge > 45) {
  problems.push(
    `contracts/mcp-modes.json is ${contractAge} days old — regenerate it from the product `
    + `repo before trusting a green run (see contracts/README.md)`,
  );
}

if (problems.length > 0) {
  console.error(`\n${problems.length} broken claim(s):\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error(
    '\nThese are instructions an agent would follow and fail on. Fix the prose or the contract.\n',
  );
  process.exit(1);
}

console.log(
  `skill claims ok — ${checked.modes} tool modes, ${checked.paths} paths, `
  + `${checked.envVars} env vars, ${checked.files} skills (contract ${contractAge}d old)`,
);
