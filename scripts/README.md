# Relay Scripts

This directory contains official project scripts plus a small set of retained diagnostics.

## Official Scripts

- `verify-prod-ready.ps1`: Runs root type-checks, tests, Rust checks, Anchor build, frontend tests, and frontend build.
- `write-e2e-verification-artifact.ts`: Runs the Relay E2E flow and writes a JSON verification artifact under `artifacts/<environment>/`.
- `run-demo-api.ps1`: Starts the devnet demo API with explicit local/demo environment settings.
- `devnet/deploy-devnet.ps1`: Deploys or upgrades a named program on devnet.
- `devnet/force-deploy-devnet.ps1`: Emergency devnet redeploy helper for `match_offer`; use only when normal deployment is blocked by stale buffers or rate limits.

## Utility Scripts

Utilities in `utils/` are optional diagnostics retained from devnet debugging:

- `convert_pubkey.ts`: Converts a known 32-byte hex public key into Solana base58 form.
- `decode_world.ts`: Fetches and attempts to decode a MagicBlock World account.
- `fetch.ts`: Finds a recent non-loader transaction for a known devnet address.
- `query_devnet.js`: Dumps recent transaction logs for known buyer/seller addresses.

These utilities are not part of the normal build, test, or deployment flow.

## Common Commands

```bash
npm run build
npm test
npm run test:e2e
npm run verify:prod-ready
npm run build:frontend
```

Deploy a devnet program:

```powershell
npm run deploy:devnet -- -ProgramName system_match_offer -ProgramId Cr4ZyqvML9tS5HeAFXLTKfBxJKixQStL8dGFmfbUx585
```

