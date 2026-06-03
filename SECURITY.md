# Security Policy

Relay is currently a devnet-stage protocol implementation. Treat this repository as protocol infrastructure, not as a production mainnet deployment record.

## Reporting

Report suspected vulnerabilities privately to the repository maintainers. Include affected files, reproduction steps, expected impact, and any relevant transaction signatures or logs.

## Key Management

Do not commit private keys, wallet keypairs, mnemonics, admin tokens, RPC credentials, KYC provider credentials, or production deployment secrets.

Ignored local files include `.env`, `.devnet-*.json`, `.relay-state*.json`, generated ledgers, logs, and build outputs. If a secret is accidentally committed, rotate it immediately and remove it from history before publishing.

## Production Readiness

Before mainnet deployment:

- Review and close high-impact findings in `docs/audit.md`.
- Disable demo-only settings such as unauthenticated admin access, mock KYC, review mode clearance shortcuts, and custodial-payment shortcuts unless they are explicitly controlled.
- Use production wallet custody controls for deployer, operator, settlement, clearance, and treasury roles.
- Re-run root tests, frontend tests, `cargo check --workspace`, `anchor build`, and devnet E2E verification.

