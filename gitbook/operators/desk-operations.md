# Desk Operations

Relay can be used as a private coordination layer for desks, treasuries, and project teams.

## Operating Model

1. Define the asset or token block.
2. Define counterparty constraints.
3. Create a private RFQ.
4. Admit qualified buyers or desks through clearance.
5. Evaluate bids privately.
6. Execute atomic settlement.
7. Record public settlement state.

## Private Secondary Desk

For private secondaries, the desk should confirm:

- Asset type.
- Seller authority.
- Transfer restrictions.
- Required issuer consent.
- Required settlement attestation.
- Buyer eligibility.

## Liquid OTC Desk

For liquid token OTC, the desk should confirm:

- Token mint.
- Block size.
- Settlement currency.
- Price constraints.
- Treasury routing.
- Counterparty eligibility.

## Operational Discipline

Relay reduces information leakage, but operators should still limit off-protocol disclosure. RFQ metadata, screenshots, wallet labels, and settlement timing can all leak strategy if mishandled.
