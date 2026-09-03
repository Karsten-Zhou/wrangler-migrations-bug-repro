# Wrangler D1 Migrations Path Bug Repro (Vite Plugin)

## Issue
When using `@cloudflare/vite-plugin` + `wrangler deploy` with auto-provisioning, the original `wrangler.jsonc` gets its `migrations_dir` path incorrectly rewritten.

## Project Layout
```
project/
├── wrangler.jsonc      # Original config
├── vite.config.ts      # @cloudflare/vite-plugin
├── package.json
├── tsconfig.json
├── migrations/
│   └── 0001_init.sql
└── server/
    └── index.ts
```

## Steps to Reproduce

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npx vite build
   ```

3. Deploy the first time (the subsequent deployments won't trigger the auto-provisioning):
   ```bash
   npx wrangler deploy
   ```

## What Happens

1. `@cloudflare/vite-plugin` generates `dist/my-app/wrangler.json` with:
   ```json
   "migrations_dir": "../../migrations"
   ```
   This is **correct** relative to `dist/my-app/`.

2. Wrangler auto-provisions the D1 database (since `database_id` is missing).

3. Wrangler writes the `database_id` back to the config.

4. **BUG:** It also writes `"migrations_dir": "../../migrations"` into the **original** `wrangler.jsonc`.

5. The original config now has an incorrect path. Subsequent database migrations fail because `../../migrations` is wrong relative to the project root.

## Root Cause

The bug is in the interaction between two Wrangler behaviors:

1. **Vite plugin** (`output-config.ts`) correctly rewrites `migrations_dir` for the generated `dist/<name>/wrangler.json`.
2. **Wrangler auto-provisioning** (`experimental_patchConfig`) writes the **entire binding object** (including the rewritten `migrations_dir`) back to the original config file, instead of only updating the `database_id` or preserving the original `migrations_dir` value.

## Expected Fix

When `experimental_patchConfig` patches the original `wrangler.jsonc`, it should either:
- Only patch the `database_id` field, leaving `migrations_dir` untouched
- Rebase `migrations_dir` back to the original config's directory before writing

## Environment
- OS: Windows
- Node: v24.13.0
- Wrangler: 4.128.0
- @cloudflare/vite-plugin: 1.54.3
- Vite: 8.2.2