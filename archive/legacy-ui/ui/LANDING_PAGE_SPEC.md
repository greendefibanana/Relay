# Relay dApp Landing Page Specification

This document describes the Relay landing page content structure. It is a reference for future UI work; the active app lives in `Frontend`.

The page should preserve the existing visual system, component order, and hero treatment. Relay's positioning is:

> Relay is a private OTC and secondary market liquidity layer for Solana, enabling confidential negotiation and atomic settlement for both liquid and illiquid assets.

## 1. Main Page Assembly (`LandingPage.js`)

The landing page is a vertical stack of existing components. The `landing_page_oth` class handles the background and padding for the sections following the Hero.

```javascript
import HeaderComponents from "../components/headerComponents";
import HeroSectionComponents from "../components/heroSectionComponents";
import MainpurposeComponents from "../components/mainPurposeComponents";
import UsecasesComponents from "../components/usecasesComponents";
import RoadMapComponents from "../components/RoadMapComponents";
import OurTokennomicsComponents from "../components/ourtokenNomicsComponents";
import ContactSectionComponents from "../components/contactUsComponents";

const LandingPage = () => {
    return (
        <div>
            <HeaderComponents/>
            <HeroSectionComponents/>
            <div className="landing_page_oth">
                <MainpurposeComponents/>
                <UsecasesComponents/>
                <RoadMapComponents/>
                <OurTokennomicsComponents/>
                <ContactSectionComponents/>
            </div>
            <footer>{/* Existing footer */}</footer>
        </div>
    );
}
```

## 2. Component Reference

### A. Navigation Header (`HeaderComponents.js`)

- **Features:** Logo, nav links (Trade, Stake, Docs), and "Open Dapp" button.
- **Mobile:** Uses the existing popover menu and hamburger icon.

### B. Hero Section (`HeroSectionComponents.js`)

- **Instruction:** Retain the current hero text and structure.
- **Purpose:** Keep the first viewport focused on private secondary markets for tokens, SAFTs, SAFEs, and vesting contracts powered by Solana PERs.

### C. Main Purpose Section (`MainpurposeComponents.js`)

- **Layout:** Three cards in a row.
- **Animation:** Existing `framer-motion` scale entrance.
- **Content direction:**
  1. Shielded execution with public Solana settlement.
  2. Secondary and OTC liquidity for SAFTs, SAFEs, vested tokens, locked allocations, token blocks, treasury sales, and whale-to-whale deals.
  3. Relay Match Protocol for confidential RFQ matching inside TEE-backed sessions.

### D. Features / Use Cases (`UsecasesComponents.js`)

- **Layout:** Existing 3-column layout with left text cards, center image, and right text cards.
- **Feature direction:**
  1. BOLT ECS split-state architecture with public `AssetRegistry` and confidential `DealTerms`.
  2. TEE-based `BuyerClearance` for KYC, accreditation, transfer restrictions, and counterparty eligibility.
  3. Private OTC block trades for liquid token blocks, treasury sales, market maker/project coordination, and whale-to-whale trades.
  4. Atomic Solana settlement after private RFQ matching.

### E. Roadmap (`RoadMapComponents.js`)

- **Layout:** Existing horizontal timeline.
- **Content direction:** Preserve BOLT ECS, TEE matcher, devnet/MVP, mainnet, institutional pilot, compliance SDK, and secondary market language. Future roadmap copy may add private OTC desk pilots where it fits naturally.

### F. Tokenomics / Team Section (`OurTokennomicsComponents.js`)

- **Status:** Optional or hidden depending on the active app configuration.
- **Instruction:** Do not reintroduce public presale positioning unless the product direction changes.

### G. Call to Action (`ContactSectionComponents.js`)

- **Content direction:** Keep the existing CTA structure and route. Labels should point users toward opening the dApp, creating a private RFQ, or viewing the liquidity market.

## 3. Product Paths to Reflect in Copy

### Private Secondary Market

Relay supports confidential secondary liquidity for:

- SAFTs
- SAFEs
- Vested tokens
- Locked allocations
- Agreement-backed private positions

### Private OTC Desk

Relay supports confidential OTC workflows for:

- Private token block trades
- Treasury OTC trades
- Whale-to-whale OTC deals
- Confidential buyer/seller matching
- Market maker/project OTC coordination

## 4. Technical Language to Preserve

Copy updates should keep the following concepts native to the product:

- MagicBlock Private Ephemeral Rollups
- BOLT ECS
- Trusted Execution Environments (TEEs)
- Solana Devnet and Solana settlement
- Shielded RFQ flow
- `BuyerClearance`
- Confidential `DealTerms`
- Public `AssetRegistry`
- Atomic settlement

## 5. Tone

- Professional, concise, and institutional.
- Focus on privacy, confidential negotiation, reduced information leakage, and atomic settlement.
- Avoid hype, meme-language, and broad claims that the current protocol does not support.
