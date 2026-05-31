# Private OTC Desk

Relay supports private OTC workflows for liquid token block trades.

## Supported Use Cases

- Private token block trades.
- Treasury OTC sales.
- Whale-to-whale OTC deals.
- Confidential buyer and seller matching.
- Market maker and project coordination.
- Strategic allocation transfers.

## Why Liquid Tokens Still Need Private OTC

Liquid tokens can trade on public venues, but large or sensitive trades often should not expose intent before completion.

Examples:

- A project treasury wants to sell a block without signaling distress.
- A market maker wants to source inventory without revealing positioning.
- A whale wants to negotiate size without creating public pressure.
- A buyer wants access to size without moving the market ahead of execution.

Relay creates a private RFQ environment for these workflows.

## OTC Flow

1. A seller, treasury, or desk creates a private RFQ.
2. Buyers or desks submit confidential bids.
3. Relay checks eligibility and constraints inside the TEE.
4. Matching logic executes privately.
5. Settlement is committed atomically to Solana.

## What Relay Adds

- Reduced pre-trade information leakage.
- Confidential buyer and seller matching.
- Private price discovery.
- Atomic settlement.
- Optional policy controls for fees, settlement authority, and buyer clearance.

Relay is not a public order book. It is a confidential negotiation and settlement layer for trades that are too sensitive for public intent.
