# Relay: Private Institutional Liquidity Layer for Solana

## A Revolution in Decentralized Finance

Every once in a while, a revolutionary product comes along that changes everything. Today, we are introducing something that will fundamentally alter how value and information are negotiated on-chain. We call it **Relay**.

For years, you've been forced to choose. We were told you can have the blazing speed and open composability of Solana, *or* you can have the privacy and institutional-grade shielding of traditional finance. We were told you couldn't have both. 

Well, we didn't accept that. Today, we're giving you both. 

### The Problem: The "Locked Capital" Trap

Here's the reality: billions of dollars in value are trapped right now in private agreements—SAFTs, SAFEs, and vesting contracts. It's a tragedy of locked capital. 

If founders and early employees try to sell vested positions on public DEXs, it signals "insider dumping." It causes negative price impact. It’s a PR nightmare. And what about the buyers? They have no decentralized way to verify the terms of a private contract without slow, manual, off-chain legal review. 

The compliance overhead alone—KYC/AML, transfer restrictions—makes secondary transfers excruciatingly expensive and phenomenally illiquid. 

It’s broken. And we set out to fix it.

### The Solution: Relay’s Private Architecture

What if you could negotiate in total privacy, but settle instantly on the fastest public ledger in the world? 

Relay utilizes something truly magical: **Ephemeral Rollups**. We create a "Confidential Session" where assets can be traded without exposing a single drop of sensitive data to the public Solana ledger.

#### Confidential State Management
We took the **BOLT ECS framework** and did something extraordinary. We split asset data into two elegant layers:
1. **The Public Registry:** It simply confirms the existence of an asset—say, "Company X Series A SAFT"—and its current owner. Beautifully transparent.
2. **The Confidential Components:** This is where the magic happens. Encrypted state containing the `strike_price`, `min_bid`, and `vesting_schedules`. It’s only accessible within the **Trusted Execution Environment (TEE)**. It is completely shielded.

#### The Relay Match Protocol (RMP)
We moved the "matching engine" completely off the mainnet and into a high-speed, private rollup. 

It works like this: A seller "locks" their asset on the Solana Mainnet and "delegates" control to a Relay Ephemeral Rollup. Buyers submit their encrypted bids directly into the enclave. The TEE matches bids against the seller's private `min_price`. 

And when a match occurs? Boom. Atomic Settlement. The rollup state is "undelegated," instantly updating ownership on the mainnet while keeping the transaction price entirely hidden from public explorers. It just works.

### Technical Implementation

We engineered Relay for the 2026 Solana ecosystem. We demanded sub-50ms latency. We demanded hardware-grade security.

* **Execution Environment:** MagicBlock V2 with Intel TDX TEEs. It’s a fortress.
* **State Machine:** BOLT Entity Component System.
* **Compliance Engine:** `BuyerClearance` component enforcing programmatic whitelist checks inside the TEE.
* **Privacy Primitive:** Confidential PDAs.
* **Data Feed:** Optional Pyth Lazer reference pricing for assets with liquid underlyings.

### Unlocking the Future

This isn't just theory. This is about real use cases that change the game today.

1. **Founder Liquidity:** Founders can finally liquidate small portions of equity to accredited investors. Privately. Seamlessly.
2. **Employee Secondary Markets:** Employees can sell vested tokens to institutional desks *before* public listings.
3. **Institutional OTC:** We're talking high-volume "Dark Pools" for major tokens like SOL, JUP, PYTH. No front-running. Zero MEV. It’s predatory-free trading.

### Compliance-as-Code

We treat Compliance-as-Code. With Relay, users provide KYC data directly to a verified TEE. The TEE issues a `BuyerClearance` component for the trade, without ever revealing your identity on-chain. Transfer restrictions—like "Cannot sell to non-US persons" or "Accredited Investors Only"—are enforced programmatically at the BOLT system bytecode level, inside the private rollup before any match can execute. It is uncompromising privacy meeting unyielding compliance.

### The Path Forward

We aren't stopping here. 
* **Phase 1:** We're launching our MVP on MagicBlock Devnet—Shielded RFQ for Vested Tokens. 
* **Phase 2:** A pilot integration with Superteam founders for early equity "test" listings.
* **Phase 3:** Mainnet launch with institutional liquidity partners and automated legal-wrapper generation.

Relay is the next evolution of Real World Assets on Solana. We’re moving beyond simple tokenization. We are enabling complex, private financial coordination.

It’s fast. It’s secure. It is Relay. And we think you're going to love it.
