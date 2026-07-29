#!/usr/bin/env node

import { access, cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(pluginRoot, 'skills');
const args = process.argv.slice(2);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

const client = valueAfter('--client') ?? 'all';
const targetRoot = resolve(valueAfter('--target') ?? process.cwd());
const customSkillsDir = valueAfter('--skills-dir');
const force = args.includes('--force');
const retiredSkills = ['done', 'implement', 'next', 'plan', 'report', 'review', 'specify', 'tasks'];

const destinations = {
  codex: '.agents/skills',
  cursor: '.cursor/skills',
  claude: '.claude/skills',
};

if (!customSkillsDir && client !== 'all' && !(client in destinations)) {
  throw new Error(`Unknown --client ${client}. Use codex, cursor, claude, or all.`);
}

const selected = customSkillsDir
  ? [['custom', customSkillsDir]]
  : client === 'all'
    ? Object.entries(destinations)
    : [[client, destinations[client]]];
const entries = await readdir(sourceRoot, { withFileTypes: true });
const discoveredSkills = await Promise.all(
  entries
    .filter((entry) => entry.isDirectory())
    .map(async (entry) => {
      try {
        await access(join(sourceRoot, entry.name, 'SKILL.md'));
        return entry.name;
      } catch {
        return null;
      }
    }),
);
const skills = discoveredSkills.filter((skill) => skill !== null).sort();

for (const [name, relativeDestination] of selected) {
  const destinationRoot = resolve(targetRoot, relativeDestination);
  await mkdir(destinationRoot, { recursive: true });

  if (force) {
    for (const retiredSkill of retiredSkills) {
      await rm(join(destinationRoot, retiredSkill), { recursive: true, force: true });
    }
  }

  for (const skill of skills) {
    const destination = join(destinationRoot, skill);
    if (force) await rm(destination, { recursive: true, force: true });
    await cp(join(sourceRoot, skill), destination, { recursive: true, errorOnExist: true, force: false });
  }

  process.stdout.write(`Installed ${skills.length} Atisbo skills for ${name} in ${destinationRoot}\n`);
}

process.stdout.write('Configure the Atisbo MCP server from .mcp.json and set SENSO_MCP_KEY in the agent environment.\n');
