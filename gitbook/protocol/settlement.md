# Settlement

Relay settles matched trades atomically on Solana.

## Settlement Goals

Settlement should:

- Commit final ownership state.
- Route payment according to policy.
- Preserve confidential deal terms.
- Avoid partial execution where possible.
- Keep public state minimal and verifiable.

## Payment Routing

`PaymentRoutingPolicy` controls protocol and operator treasury routing.

The `match_offer` flow can route native SOL to the seller and configured treasuries while updating listing state.

## AssetRegistry Commit

After a successful match, Relay commits updated `AssetRegistry` state back to base-layer Solana.

This gives counterparties a public settlement result without revealing the confidential terms stored in `DealTerms`.

## DealTerms Confidentiality

By default, Relay keeps `DealTerms` delegated and confidential inside PER.

This protects:

- Negotiated price constraints.
- Vesting details.
- Buyer restrictions.
- Private RFQ logic.

## Failure Modes

Settlement can fail if:

- Buyer clearance is missing or expired.
- Bid price does not satisfy private constraints.
- Required settlement attestation is missing.
- Transfer consent is required but not issued.
- Payment routing policy is misconfigured.
- PER or Solana RPC state is unavailable.
