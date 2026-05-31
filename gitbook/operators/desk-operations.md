# Desk Operations

Relay can be used as a private coordination layer for desks, treasuries, and project teams.

## Operating Model

1. Define the asset or token block.
2. Define counterparty constraints.
3. Create a private RFQ.
4. Copy the generated RFQ URL.
5. Share the URL with the intended buyer, desk, market maker, or approved participant.
6. Admit qualified buyers or desks through clearance.
7. Evaluate bids privately.
8. Execute atomic settlement.
9. Record public settlement state.

## Shareable RFQ Links

Each offer can be distributed as a direct URL.

This is useful when the operator already knows the right counterparty and does not want the buyer to search through the market page. It also supports desk workflows where the same offer may be selectively shared with a small list of qualified buyers.

Use the link according to the sensitivity of the trade:

- Reserved placements: share only with the intended buyer.
- Treasury OTC: share with approved desks or market makers.
- Broader RFQs: share through controlled channels or list publicly in the market view.

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

If an RFQ link is shared too widely, cancel the listing and recreate it with tighter buyer constraints.
