Submit here: https://superteam.fun/earn/grants/agentic-engineering

## Step 1: Basics

**Project Title**
> Relay Agentic Verification Pack

**One Line Description**
> Relay is a private RFQ protocol for Solana that keeps deal terms confidential inside MagicBlock-powered TEEs while settling ownership publicly on Solana; this grant funds a focused agentic engineering sprint to package the current prototype into a reproducible verification and onboarding asset.

**TG username**
> t.me/<your-telegram-username>

**Wallet Address**
> <your-solana-wallet-address>

## Step 2: Details

**Project Details**
> Relay is building a shielded RFQ layer for illiquid and vesting-linked assets on Solana. The core architecture splits state into public ownership and confidential deal terms, using MagicBlock PER / TEE execution to keep pricing and negotiation constraints private while settling ownership changes back to Solana. This is aimed at higher-trust OTC-style flows where public negotiation leaks too much information.
>
> The repo already contains a real prototype rather than a pure concept. It includes a documented devnet end-to-end flow, a TypeScript protocol client and API layer, architecture and whitepaper docs, and a production-readiness plan that clearly states what is done versus what still blocks mainnet. In this session, the local quality gates `npm.cmd run typecheck` and `npm.cmd test` both passed, and the current Codex session transcript was exported as `codex-session.jsonl` for submission proof.
>
> I am not positioning this grant as funding for the full Relay protocol. I am applying for a narrowly scoped agentic engineering milestone: turn the current prototype into a stronger public engineering artifact with reproducible verification, cleaner evidence, a contributor runbook, and a hardening checklist that makes the system easier to review, extend, and ship.

**Deadline**
> 2026-04-30

**Proof of Work**
> GitHub repo: https://github.com/greendefibanana/Relay
>
> Recent shipped work from git history includes:
> `391977f` Refactor `match_offer` program and protocol client for improved delegation reliability and frontend UX
> `a1b2b82` Refactor `match_offer` to consolidate transactions, update protocol client, and fix frontend safety check
> `5811005` Update protocol client and add fetch utility
> `5a727f5` Hackathon v1: Private RFQ flow with BOLT ECS and PER
>
> Repo artifacts that demonstrate progress:
> `DEVNET_E2E.md` documents a successful PER-backed devnet flow
> `PRODUCTION_READINESS_PLAN.md` defines the path from prototype to production
> `smart_contract_audit.md` captures current security findings and hardening priorities
> `README.md` and `Relay_Whitepaper.md` explain the product and architecture
>
> Current local verification from this session:
> `npm.cmd run typecheck` passed
> `npm.cmd test` passed
>
> AI-assisted development proof file exported in the project root:
> `codex-session.jsonl`

**Personal X Profile**
> x.com/<your-handle>

**Personal GitHub Profile**
> github.com/greendefibanana

**Colosseum Crowdedness Score**
> Visit https://colosseum.com/copilot, get the project's Crowdedness Score, take a screenshot, upload it to a public Google Drive link, and paste that link here.

**AI Session Transcript**
> Attach `codex-session.jsonl` from the project root.

## Step 3: Milestones

**Goals and Milestones**
> 1. By 2026-04-20: finalize a clean grant-facing verification pack for Relay, including updated architecture summary, current status, and reproducible commands.
>
> 2. By 2026-04-24: produce a cleaned devnet evidence bundle for the shielded RFQ flow, including exported session proof, verification notes, and reviewer-facing documentation.
>
> 3. By 2026-04-27: publish a contributor runbook that explains how to run the server, verify the local checks, and understand the split between public settlement and confidential deal terms.
>
> 4. By 2026-04-30: deliver a hardening checklist and milestone handoff that clearly separates prototype-ready functionality from mainnet blockers, so future contributors and reviewers can evaluate Relay quickly.

**Primary KPI**
> Recommended KPI: publish 1 complete, reproducible Relay verification pack by 2026-04-30 that includes passing local checks, a devnet proof artifact, a contributor runbook, and an attached Codex session transcript.

**Alternative KPI options**
> Option A: 3 fully documented successful Relay devnet RFQ verification runs by 2026-04-30.
>
> Option B: reduce reviewer onboarding time to under 10 minutes by shipping one consolidated verification pack with commands, artifacts, and current status.
>
> Option C: enable 1 external builder to reproduce the core Relay verification flow from the repo using the published runbook.

**Final tranche checkbox**
> To receive the final tranche, submit the Colosseum project link, GitHub repo, and AI subscription receipt.

## Notes

**What to keep honest in the application**
> Relay is a real prototype, not yet a mainnet-ready protocol. The repo already shows meaningful progress, but `anchor build` / IDL cleanliness, cryptographic settlement proof enforcement, replay protection, and payment / escrow completion are still open items. Framing the ask as a verification-and-hardening microgrant is stronger than overclaiming full production readiness.

**Files ready for submission**
> `codex-session.jsonl`
> this application draft
> your Crowdedness Score screenshot link

Submit here: https://superteam.fun/earn/grants/agentic-engineering
