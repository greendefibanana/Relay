# Risk and Controls

Relay is designed for sensitive transactions. Operators should treat configuration, authority management, and clearance issuance as core risk controls.

## Key Risks

- Misconfigured payment routing.
- Incorrect settlement authority.
- Missing buyer clearance.
- Expired or overbroad clearance.
- Incorrect asset type.
- Incorrect vesting metadata.
- Off-chain disclosure outside the protocol.
- RPC or TEE availability issues.

## Controls

- Use scoped buyer clearance where possible.
- Rotate authority keys deliberately.
- Keep admin actions server-side.
- Use review mode only for demos and test flows.
- Verify IDLs and program IDs before demonstrations.
- Run verification scripts before external walkthroughs.

## Governance and Policy

Relay's policy components are intentionally explicit. Payment routing and settlement authority should be reviewed before production deployments or partner pilots.
