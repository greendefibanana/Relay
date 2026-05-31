# Private Secondary Market

Relay enables private secondary liquidity for restricted or agreement-backed assets.

## Supported Use Cases

- SAFT transfers.
- SAFE transfers.
- Vested token sales.
- Locked allocation sales.
- Employee or founder liquidity.
- Private investor secondaries.
- Issuer-controlled transfer workflows.

## Why It Matters

Private secondary transfers are difficult because the important terms are not meant to be public.

Sellers may not want to signal liquidity needs. Buyers may need to verify transfer eligibility. Issuers may need to enforce restrictions. Public negotiation can damage execution quality and reputation before a trade is complete.

Relay gives these transfers a private RFQ path.

## Typical Flow

1. A seller creates a private listing.
2. Relay creates the relevant BOLT entities and components.
3. `DealTerms` stores private constraints such as minimum price, valuation cap, vesting schedule, and transfer restrictions.
4. The listing is delegated into a Private Ephemeral Rollup.
5. Buyers submit bids through the RFQ flow.
6. The TEE evaluates buyer clearance and matching conditions.
7. If matched, Relay settles atomically and updates the public `AssetRegistry`.

## What Stays Private

- Minimum acceptable price.
- Bid details.
- Vesting schedule details.
- Buyer restrictions.
- Settlement readiness checks.
- Issuer consent state where applicable.

## What Settles Publicly

- Final ownership state.
- Settlement result.
- Public registry state required by the protocol.
