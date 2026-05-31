# Market Problem

Crypto market structure has strong public execution venues, but many institutional flows still happen privately.

The reason is simple: some trades are harmed by public intent.

## The Market Gap

The crypto stack has public execution and public settlement. Institutional private markets need private negotiation and verifiable settlement.

```mermaid
quadrantChart
    title Crypto market structure gap
    x-axis Low settlement assurance --> High settlement assurance
    y-axis Public negotiation --> Private negotiation
    quadrant-1 "Relay target"
    quadrant-2 "Traditional OTC"
    quadrant-3 "Informal/manual deals"
    quadrant-4 "Public DEX/AMM"
    "Public AMMs": [0.82, 0.18]
    "Manual OTC chats": [0.28, 0.78]
    "Private secondaries": [0.35, 0.72]
    "Relay": [0.86, 0.84]
```

Relay is designed for the top-right quadrant: private negotiation with high-assurance settlement.

## Information Leakage

Information leakage changes execution quality.

If a market sees a large seller before the trade is complete, prices can move against that seller. If a treasury sale becomes visible too early, it can create governance, community, or market pressure. If a restricted secondary transfer exposes buyer criteria, it can leak private compliance and allocation details.

Relay is built for markets where the negotiation itself is sensitive.

| Leakage type | Example | Cost |
| --- | --- | --- |
| Size leakage | A whale reveals intended block size | Adverse price movement |
| Direction leakage | A treasury sale becomes visible too early | Narrative and governance pressure |
| Terms leakage | A private secondary exposes min price or vesting data | Lost negotiating leverage |
| Eligibility leakage | Buyer restrictions become public | Privacy and compliance risk |
| Strategy leakage | Market maker inventory needs become visible | Reduced execution quality |

## Private Secondaries Are Manual

SAFTs, SAFEs, vested tokens, and locked allocations are often transferred through slow off-chain processes:

- Manual buyer discovery.
- Manual eligibility checks.
- Manual term review.
- Manual settlement coordination.
- High trust in intermediaries.

This creates friction for sellers, buyers, issuers, and desks.

{% hint style="info" %}
Private secondaries do not fail because demand is absent. They fail because discovery, eligibility, negotiation, and settlement are fragmented.
{% endhint %}

## OTC Token Blocks Are Fragmented

Liquid token block trades have a different problem. The asset is liquid, but the trade is too large or too sensitive for public venues.

Typical OTC problems include:

- Counterparty discovery.
- Price discovery without revealing size.
- Treasury sale coordination.
- Market maker inventory coordination.
- Settlement risk across off-chain agreements.

Relay gives these flows a private RFQ path with on-chain settlement.

## Why Now

Relay is timely because three forces are converging:

| Force | What changed | Why it matters |
| --- | --- | --- |
| Solana settlement maturity | Low-latency, high-throughput settlement is credible for more complex flows | Private negotiation can now settle on fast public rails. |
| Larger private crypto markets | Teams, employees, funds, and treasuries hold more restricted or strategic positions | Secondary and OTC demand is becoming institutional. |
| Privacy as execution quality | Public intent increasingly creates measurable cost | Confidential RFQ becomes a market-structure advantage. |

## Why Relay Wins

Relay wins if it becomes the default private coordination layer before Solana settlement.

That wedge is narrow enough to be credible and large enough to expand:

1. Start with shielded RFQs for vested and restricted assets.
2. Extend to token block trades and treasury OTC.
3. Become the private liquidity interface for issuers, desks, and market makers.
4. Expand into broader confidential settlement workflows.
