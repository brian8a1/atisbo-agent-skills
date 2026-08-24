# PUBLISH.md — shipping the `atisbo` npm package

The package lives at [`packages/mcp-client`](packages/mcp-client). It is the official
TypeScript client for Atisbo's two public MCP servers, and it is what makes Atisbo present
in npm's ecosystem: an official SDK on the registry is a surface scanners (ora.ai's among
them) read to decide whether a product exists outside its own website.

**Publishing is Brian's action.** Everything below assumes the merge already happened and
you are authenticated as the package owner.

## One-time setup

```bash
npm login            # Brian's npm account; verify with `npm whoami`
```

`atisbo` (unscoped) was free on the registry when this was prepared — `npm view atisbo`
returned 404 on 2026-08-24. If it has been taken since, fall back to `@atisbo/mcp-client`,
which first requires creating an `atisbo` org on npmjs.com (org names cannot be created
from the CLI), and then changing `name` in `packages/mcp-client/package.json`, the
`--access public` flag on publish, and every import in its README.

## Before you publish

1. Confirm the license decision. The package ships with `"license": "MIT"`, chosen because
   that is the convention for SDKs people are expected to adopt. It is Brian's call: if you
   prefer to keep all rights reserved, set `"license": "UNLICENSED"` in
   `packages/mcp-client/package.json`, add a top-level `LICENSE` file for the repo, and
   expect npm to warn but still publish.
2. Pull latest `main`, then:

```bash
cd packages/mcp-client
npm install          # typescript + @types/node only — build-time, never shipped
npm test             # builds dist/esm + dist/cjs and runs the offline suite
ATISBO_INTEGRATION=1 npm test   # one pass against the live docs server
```

3. Sanity-check what would actually ship — `files` allowlists `dist/` + `README.md`, so no
   source maps of your machine's paths, no tests, no node_modules:

```bash
npm pack --dry-run
```

4. Smoke-test the packed tarball the way a consumer would receive it:

```bash
npm pack
cd "$(mktemp -d)" && npm init -y >/dev/null && npm i "$OLDPWD"/atisbo-0.1.0.tgz
node -e "import('atisbo').then(async m => { const c = new m.AtisboMcpClient({server:'docs'}); console.log((await c.searchDocs('mcp',1)).results); })"
node -e "const m = require('atisbo'); console.log(typeof m.AtisboMcpClient)"   # CJS entry too
rm -f "$OLDPWD"/atisbo-0.1.0.tgz
```

## Publish

```bash
cd packages/mcp-client
npm publish
```

Unscoped packages are public by default, so no `--access` flag is needed. The publish will
carry no provenance attestation — that requires publishing from CI with OIDC, which this
repo does not run (there is no GitHub Actions workflow by decision); if provenance matters
to you later, it needs a CI publisher first.

First release is `0.1.0`. Do not delete a version from the registry afterwards — republish
the same number is impossible; ship `0.1.1`.

## Verify after publishing

```bash
npm view atisbo                      # name, version, dist-tags, repository URL
npm view atisbo repository.url       # must be github.com/brian8a1/atisbo-agent-skills
npm view atisbo homepage             # https://atisbo.dev
```

- The `repository` field is how ora.ai and npm itself attribute the package to this repo —
  if it is missing or points somewhere else, the package reads as an unofficial mirror.
- Install it fresh somewhere (`npm i atisbo`) and run the quickstart from
  `packages/mcp-client/README.md`.
- Check https://www.npmjs.com/package/atisbo renders the README.

Then update this file's "was free on the registry" note with the publish date so the next
release starts from current facts.
