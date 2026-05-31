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
2. Relay generates a shareable offer URL for direct counterparty distribution.
3. Buyers or desks open the URL and submit confidential bids.
4. Relay checks eligibility and constraints inside the TEE.
5. Matching logic executes privately.
6. Settlement is committed atomically to Solana.

## Shareable OTC Links

Every RFQ can behave like a portable deal room. A treasury can create an offer, copy the generated URL, and send it directly to a buyer, desk, or market maker.

This mirrors how OTC markets already operate: relationship-driven distribution first, settlement after terms are agreed.

The link routes counterparties directly to the offer page, but it does not bypass protocol controls. Buyer clearance, reserved buyer checks, transfer consent, and settlement requirements still apply before a match can execute.

## What Relay Adds

- Reduced pre-trade information leakage.
- Confidential buyer and seller matching.
- Private price discovery.
- Portable offer URLs for direct OTC distribution.
- Atomic settlement.
- Optional policy controls for fees, settlement authority, and buyer clearance.

Relay is not a public order book. It is a confidential negotiation and settlement layer for trades that are too sensitive for public intent.
