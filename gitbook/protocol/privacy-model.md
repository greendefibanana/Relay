# Privacy Model

Relay is designed to reduce information leakage during negotiation.

## Confidential by Default

The following data is intended to remain confidential inside the PER/TEE path:

- Minimum price.
- Bid price before execution.
- Vesting details.
- Buyer constraints.
- Transfer restrictions.
- Clearance state.
- Private RFQ recipient.
- Block size and negotiation range.

## Public Where Settlement Requires It

The following state can be visible on Solana:

- Public ownership state.
- Settlement result.
- Component accounts required by the protocol.
- Transactions needed to commit state.

## Why Split Privacy Matters

Full opacity can reduce trust. Full transparency can damage execution.

Relay uses split-state architecture so counterparties can keep sensitive negotiation data private while still producing verifiable settlement outcomes.

## Current Trust Boundary

Relay relies on:

- Correct implementation of BOLT components and systems.
- MagicBlock PER execution.
- TEE integrity and attestation.
- Relayer behavior for infrastructure transactions.
- Correct configuration of policies, authorities, and environment variables.

See [Trust Assumptions](../resources/trust-assumptions.md) for more detail.
