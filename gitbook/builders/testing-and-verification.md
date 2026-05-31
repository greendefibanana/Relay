# Testing and Verification

Relay includes tests and verification scripts for the request layer, frontend build, and production-readiness checks.

## Unit and Request Validation Tests

```bash
npm test
```

These tests validate request parsing, buyer clearance behavior, review mode, and important protocol invariants.

## Frontend Build

```bash
npm --prefix Frontend run build
```

This verifies the active frontend compiles.

## Production-Ready Verification

```bash
npm run verify:prod-ready
```

Use this before demos, grant reviews, or investor walkthroughs.

## Suggested Review Checklist

- Confirm `DealTerms` remains confidential by default.
- Confirm `BuyerClearance` is required before `match_offer`.
- Confirm public request endpoints do not expose admin privileges.
- Confirm frontend does not expose admin tokens.
- Confirm Devnet state and IDLs match the expected deployment.
- Confirm sensitive environment variables are not committed.
