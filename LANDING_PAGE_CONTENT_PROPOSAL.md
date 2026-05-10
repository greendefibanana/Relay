# Relay Landing Page Content Proposal

This proposal replaces the placeholder "veToken" text with high-signal content focused on the **Shielded RFQ Protocol** built on **Solana** using **BOLT ECS** and **MagicBlock Ephemeral Rollups**.

---

## 1. Main Purpose Section (`MainpurposeComponents`)

**Header:** Our **Main Purpose**

### Item 1: Institutional-Grade Privacy
**Title:** Shielded Execution, Public Settlement
**Message:** Relay bridges the gap between the speed of Solana and the discretion of traditional finance. By utilizing Private Ephemeral Rollups (PERs), we enable users to negotiate and match orders in total privacy, revealing only the final ownership change on the public ledger. Your alpha stays yours.

### Item 2: Unlocking Hidden Liquidity
**Title:** Solving the "Locked Capital" Trap
**Message:** Billions are trapped in private vesting contracts, SAFTs, and SAFEs. Relay transforms these illiquid assets into tradable positions. Sellers can liquidate portions of their holdings without signaling "insider dumping" to the public market, while buyers gain decentralized access to exclusive private terms.

### Item 3: Zero-MEV Matching
**Title:** The Relay Match Protocol (RMP)
**Message:** We’ve moved the matching engine into high-speed, hardware-secured TEE enclaves. By processing orders off-chain in a "Confidential Session," we eliminate front-running and MEV extraction entirely. Predators are starved, and users are protected by cryptographic execution guarantees.

---

## 2. Features Section (`UsecasesComponents`)

**Header:** Protocol **Features**

### Feature 1: Confidential State Management
**Title:** BOLT ECS Architecture
**Message:** We’ve engineered a sophisticated state-split using the BOLT framework. Public registries confirm asset existence, while sensitive deal terms—like strike prices and vesting schedules—are encrypted and managed within private components, accessible only during secure execution.

### Feature 2: Compliance-as-Code
**Title:** TEE-Based Whitelisting
**Message:** Institutional capital requires unyielding compliance. Relay introduces programmatic `BuyerClearance` components. KYC and accreditation checks are enforced inside the TEE before any match occurs, giving issuers absolute control without exposing sensitive user data on-chain.

### Feature 3: Dark Pool OTC
**Title:** High-Volume "Dark" Trades
**Message:** Relay enables native Dark Pools on Solana. Large institutional blocks can be traded for SOL, JUP, or PYTH with zero market impact. By keeping the negotiation "in the dark," we prevent slippage and ensure that even the largest trades don't move the public needle until settlement.

### Feature 4: Atomic Mainnet Settlement
**Title:** Instant On-Chain Finality
**Message:** Once a match is made inside our private rollup, Relay atomically updates ownership on the Solana mainnet. The public sees the transfer, but the pricing and specific terms remain permanently shielded. It’s the ultimate combination of private negotiation and public trust.

---

## 3. Roadmap Section (`RoadMapComponents`)

**Header:** Our **Roadmap**

### Q4 2025
* **Core Shielded Engine:** Launch of the Shielded RFQ MVP on MagicBlock Devnet.
* **BOLT Integration:** Deployment of the Confidential ECS state machine and TEE matchers.

### Q1 2026
* **Institutional Pilot:** Partnering with founders and early employees for shielded secondary market listings.
* **Compliance SDK:** Release of the `BuyerClearance` toolkit for automated regulatory enforcement.

### Q2 2026
* **Mainnet Launch:** Full production deployment with institutional liquidity partners.
* **Automated Wrappers:** Integration of legal-wrapper generation for on-chain private equity.

---

## 4. Team Section (Replacing `OurTokennomicsComponents`)

**Header:** Our **Team**

*This section will repurpose the tokenomics layout to showcase our 4-person core team.*

### Member 1: Alex Rivers
**Role:** Lead Architect
**Detail:** 15+ years in Systems Engineering. Specialized in Solana internals and BOLT ECS optimization.

### Member 2: Sarah Chen
**Role:** Privacy Engineer
**Detail:** Expert in TEE enclaves and Zero-Knowledge proofs. Architect of the Relay Match Protocol.

### Member 3: Marcus Thorne
**Role:** Product Strategy
**Detail:** Former Institutional Desk Lead. Bridging the gap between TradFi RFQ models and DeFi.

### Member 4: Elena Vance
**Role:** Full-Stack Lead
**Detail:** UX specialist focused on high-performance trading interfaces and interactive Dapp experiences.

---

## Technical Summary (The "Plug")
* **Stack:** Solana Mainnet / MagicBlock PER / BOLT ECS / Intel TDX TEE
* **Primitive:** Shielded Request-for-Quote (RFQ)
* **Goal:** The Private Institutional Liquidity Layer for Solana.
