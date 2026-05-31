# FAQ

## Is Relay only for illiquid private assets?

No. Relay supports private secondary markets for illiquid assets and private OTC workflows for liquid token block trades.

## Why not just use an AMM?

AMMs are excellent for public liquidity. Relay is for trades where public intent can harm execution quality, such as treasury sales, large blocks, restricted transfers, and confidential RFQs.

## What information stays private?

Private terms can include minimum price, bid details, vesting schedules, buyer restrictions, block size, settlement constraints, and clearance data.

## What is a shareable RFQ link?

A shareable RFQ link is a direct URL to a Relay offer page. Sellers, treasuries, desks, or issuers can copy the link and send it to a buyer or market maker so the counterparty can review and match the offer without searching the market page.

The link does not bypass protocol controls. Buyer clearance, reserved buyer checks, transfer consent, and settlement requirements still apply.

## Should RFQ links be public?

Only if the offer is intended for broad discovery. For sensitive OTC or private secondary workflows, distribute the link only to approved counterparties.

## What becomes public?

Final settlement state and ownership updates can be committed to Solana through `AssetRegistry`.

## Does Relay custody assets?

Relay is designed as non-custodial infrastructure. The relayer abstracts setup transactions, but does not take custody of user assets.

## Does Relay provide KYC?

Relay v1 includes a buyer-clearance primitive. External KYC provider integration is future work.

## Is Relay live on mainnet?

Relay is currently a development-stage MVP using Solana Devnet and local MagicBlock execution environments.

## Is Relay a broker-dealer?

No. Relay is protocol infrastructure. Teams using Relay should obtain their own legal, regulatory, tax, and compliance advice.
