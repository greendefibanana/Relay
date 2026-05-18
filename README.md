# Relay: The Private Institutional Liquidity Protocol for Solana

*Every once in a while, a revolutionary protocol comes along that changes everything.*

We were told that to get the blazing speed and composability of Solana, we had to sacrifice privacy. We were told that institutional-grade shielding of private agreements—like SAFTs, SAFEs, Vested Tokens, and importantly, **Vested Memecoins**—could only happen off-chain in slow, manual legal processes.

Today, we are giving you both. Welcome to **Relay**.

Relay isn't just an app—it is a foundational **Decentralized Liquidity Layer**. It is the missing protocol that allows any dApp, institutional desk, or OTC portal to securely and privately negotiate illiquid positions on Solana.

---

##  The Magic: How It Works End-to-End

At its core, Relay solves the "Locked Capital" trap. Secondary markets for private equity or vested tokens are plagued by information leakage. Front-running, insider dumping panic, and compliance nightmares are the norm. 

For **Memecoins**—where founders and KOLs often hold massive vested schedules—Relay allows high-volume "Dark Pool" OTC trading. Teams can liquidate vested chips to institutional buyers smoothly, without crashing the public AMM price or tipping off public trackers.

Relay utilizes something truly magical: **Privacy-Preserving Ephemeral Rollups (PER)** powered by **MagicBlock's Trusted Execution Environments (TEE)**. 

### The Split-State Architecture
We took the **BOLT ECS framework** and split the state into two elegant layers:
1. **The Public Registry (`AssetRegistry`)**: It confirms the existence of the asset and its current owner on Solana. It is entirely transparent and trustless.
2. **The Confidential Data (`DealTerms`)**: This is where the magic happens. Pricing (`min_price`), valuation caps, and vesting schedules are kept completely hidden. They never touch the public ledger. They live exclusively inside the TEE.

### The Relay Match Protocol (RMP)
When an investor wants to list an asset, they "delegate" their component into the Ephemeral Rollup. Buyers submit encrypted bids directly into the secure enclave. The TEE acting as a matching engine evaluates the bids in total darkness. 

If there's a match, the Rollup executes the atomic settlement and "undelegates"—committing the updated ownership back to the Solana Mainnet instantly, while the confidential deal terms and pricing remain invisible.

You negotiate in total privacy, but you settle on the fastest public ledger in the world. It just works.

---

##  The Experience: Gasless & Frictionless

For an institutional protocol to become the standard, the UX must be flawless. Users shouldn't have to fiddle with Devnet SOL, setup fees, or multiple complex signing prompts.

Enter the **Relay Gasless Relayer Pattern**.

1. **Invisible Setup**: The heavy lifting of creating BOLT entities, attaching components, and delegating to the Ephemeral Rollup is completely abstracted. Our backend Relayer pays the setup fees and signs the infrastructure transactions. 
2. **One Click**: The user only ever signs the *actual business logic* (e.g., "Match Offer") through their Phantom wallet.
3. **Ghost Transactions**: Because the Relayer pays the delegation fees, those setup transactions don't clutter the user's personal Solana Explorer history. It is a seamless, premium, non-custodial experience. The TEE guarantees the user's cryptographic execution perfectly.

---

##  Compliance-as-Code

Privacy without compliance is a liability. Relay enforces **Compliance-as-Code**. The TEE validates KYC status and transfer restrictions (e.g., "Accredited Investors Only") natively before any state is matched. It evaluates attestor keys and signatures at the BOLT system bytecode level. 

Uncompromising privacy meeting unyielding compliance.

### V1 Compliance Status

Relay v1 uses an allowlisted buyer-clearance primitive: an authorized clearance issuer grants a buyer a clearance type, optional expiry, and optional listing scope before `match_offer` can execute. The demo and E2E flows may auto-issue this clearance for test wallets, but the protocol path still requires a real `BuyerClearance` component. Full external KYC provider integration is future work.

---

##  Running the Protocol Locally

For infrastructure integrators and core contributors, spinning up the Relay protocol locally is streamlined:

1. **Start the Local Aggregator & Dev Server:**
   ```bash
   npm run dev:server
   ```
2. **Run Prod-Ready Verification Checks:**
   ```bash
   npm run verify:prod-ready
   ```
3. **Boot the Frontend User Interface:**
   ```bash
   npm --prefix Frontend start
   ```

*Make sure your `.env` contains valid pointers for the execution cluster. When testing with the local MagicBlock Ephemeral Rollup network, the API will smoothly sync Devnet state to the local TEE instance.*

---

##  For Builders: Workspace Layout & Technical Flow

*(The following is for the technical team verifying the inner workings of the scaffold).*

### Components & Systems
- **`AssetRegistry`**: Public component. Ownership settles back to base-layer Solana.
- **`DealTerms`**: Confidential component. Stays delegated inside the PER.
- **`PaymentRoutingPolicy` / `SettlementAuthorityPolicy`**: World-scoped policies for fee routing and dynamic attestor rotation.
- **Systems**: `create_listing`, `match_offer`, `attest_vesting_settlement`, `issue_transfer_consent` executing as Magic transactions against the TEE RPC.

### End-to-End Client Flow (`clients/rfq-protocol.ts`)
1. Verifies TEE integrity (`verifyTeeRpcIntegrityNode`) and gets a PER auth token.
2. Initializes the base BOLT world and entities on the cluster.
3. Delegates `AssetRegistry` and `DealTerms` to the Ephemeral Rollup.
4. Executes compliance logic (`attest_vesting_settlement`) fully within the TEE.
5. Builds and executes `match_offer` inside the TEE, routing native SOL to the seller and operator treasuries.
6. Emits `createUndelegateInstruction` to commit the `AssetRegistry` (public ownership) back to base-layer Solana, while `DealTerms` remains delegated (confidential).

*Relay is fast. It's secure. It's the future of institutional liquidity. Prepare to be amazed.*
