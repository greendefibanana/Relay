# Superteam Agentic Engineering Grant Application Draft

Date: 2026-04-16

## Grant Fit Snapshot

As of 2026-04-16, the Superteam Earn listing for `Agentic Engineering Grants` appears to be:

- status: `Open`
- scope: `Global`
- cheque size shown: `200 USDG`
- avg. response time shown: `1 Week`

Source:

- https://superteam.fun/earn/grants/agentic-engineering

Because this reads like a microgrant rather than a full protocol grant, the strongest application is a tightly scoped engineering milestone around Relay, not a request to fund the entire product.

## Recommended Positioning

Apply for a narrow, credible deliverable:

`Relay Agentic Verification Pack`

The pitch is not "fund all of Relay."

The pitch is:

"Fund a one-week agentic engineering sprint that turns Relay's current private RFQ prototype into a reproducible, reviewable, open builder package with verifiable devnet evidence, a hardened validation loop, and contributor-ready documentation."

That fits the current grant size and is defensible from the repo's actual state.

## 1-Line Summary

Relay is a private institutional RFQ protocol for Solana that combines public settlement with confidential deal terms inside MagicBlock-powered TEEs; this grant will fund a compact agentic engineering sprint to package its verification, hardening workflow, and devnet proof into a reusable open builder asset.

## Short Application Version

### Project Title

Relay Agentic Verification Pack

### What are you building?

I am building a verification and hardening pack around Relay, a Solana protocol for shielded RFQs on illiquid and vesting-linked assets. Relay already demonstrates a devnet flow where public ownership settles on Solana while confidential deal terms remain delegated inside MagicBlock PER / TEE infrastructure. The grant-funded milestone is to turn that prototype into a reproducible engineering package: validated repo checks, a polished devnet evidence artifact, a cleaned-up operator runbook, and a contributor-facing explanation of the protocol's private execution model.

### Why is this a fit for an agentic engineering grant?

Relay is a good fit because the remaining work is not "just write more code." It is exactly the kind of structured engineering loop agents are useful for: repo-wide verification, artifact generation, documentation synthesis, gap tracking, and turning a technically dense prototype into something another builder can inspect and extend. The deliverable is an agentically-produced, human-reviewed engineering package that compresses onboarding and makes the protocol legible to contributors, reviewers, and grant programs.

### What already exists today?

- Relay already has a working devnet E2E flow documented in `DEVNET_E2E.md`.
- The repo typechecks successfully via `npm.cmd run typecheck`.
- The request-validation tests pass via `npm.cmd test`.
- The codebase includes a production-readiness plan and a security audit capturing the remaining blockers before mainnet.

### What will you deliver in one week?

- A cleaned and application-ready verification pack for Relay
- A reproducible devnet evidence bundle for the shielded RFQ flow
- A concise contributor/developer runbook for reproducing the protocol flow
- A tightened public narrative explaining what is already working versus what still blocks mainnet readiness

### Why now?

Private execution on Solana is becoming more practical because builders can now combine public settlement with trusted confidential execution environments. Relay already has the core prototype path; what it needs now is packaging, verification discipline, and clearer builder-facing proof so reviewers can assess it quickly instead of reverse-engineering the repo.

### Why are you the right team?

I am already building the protocol and have the repo, devnet traces, architecture docs, and implementation details in place. This grant would fund the final engineering pass required to turn Relay from "promising prototype" into a compact, inspectable artifact that other Solana builders and reviewers can understand immediately.

## Stronger, More Detailed Version

### Title

Relay Agentic Verification Pack for Private RFQs on Solana

### Problem

Solana is excellent at fast public settlement, but institutional and OTC-style flows still suffer from information leakage. For private secondaries, vested token sales, or negotiated block trades, exposing pricing and negotiation state on a public ledger creates front-running risk, strategy leakage, and compliance friction.

At the same time, many promising crypto prototypes fail to get traction because their engineering proof is fragmented across code, docs, half-working scripts, and local context. Reviewers cannot quickly tell what is real, what is aspirational, and what still needs work.

### Solution

Relay solves the market problem by splitting execution into two layers:

- public ownership state settles on Solana
- confidential deal terms remain inside MagicBlock-powered ephemeral rollups / TEE-backed execution

This grant milestone solves the engineering distribution problem around that prototype. The funded work packages Relay into a reusable verification and onboarding asset:

- reproducible checks
- cleaner devnet evidence
- sharper protocol explanation
- explicit gap tracking between current prototype behavior and production requirements

### What is already working in this repo

- Shielded RFQ architecture is documented in `README.md` and `Relay_Whitepaper.md`.
- The devnet E2E flow is documented in `DEVNET_E2E.md`, including public `AssetRegistry` settlement and confidential `DealTerms` remaining in PER.
- The TypeScript client and API surface already exist in `clients/rfq-protocol.ts` and `server/index.ts`.
- Local quality gates currently passing:
  - `npm.cmd run typecheck`
  - `npm.cmd test`

### What still needs to be honest about

Relay is not yet production-ready, and the application should say that clearly.

Current blockers already documented in this repo include:

- `anchor build` / IDL generation is not yet clean
- settlement proofs are not yet cryptographically enforced on-chain
- attestor allowlisting and replay protection still need hardening
- payment and escrow legs are incomplete
- parts of the backend are still thin local-service scaffolding
- the audit identifies material access-control and timestamp-trust issues that should be fixed before mainnet

That honesty improves the application because it frames the grant as a concrete milestone, not an overclaim.

### Grant Deliverables

1. Verification Pack

A single builder-facing package that explains:

- what Relay does
- what the current devnet prototype proves
- what commands reproduce the proof
- what remains before mainnet

2. Reproducible Evidence Artifact

A cleaned artifact set for the shielded RFQ flow, based on the current devnet path, so a reviewer can inspect protocol behavior without guessing.

3. Hardening Checklist

A compact engineering checklist derived from the production-readiness plan and audit, prioritized for the next milestone.

4. Contributor Runbook

A direct runbook for developers who want to run the server, execute the RFQ flow, and understand the split between public and confidential state.

### Success Criteria

- a reviewer can understand the protocol and current maturity in under 10 minutes
- a contributor can run the core checks and see passing local validation
- the repo has one clear source of truth for current functionality, evidence, and next blockers

### Budget / Ask

Requested amount: `200 USDG`

This is intentionally scoped as a microgrant for packaging, verification, and engineering clarity around an already-built private RFQ prototype.

## Suggested Form Answers

### 50-word version

Relay is a private RFQ protocol for Solana that keeps negotiated deal terms confidential inside MagicBlock TEEs while settling ownership publicly on Solana. I am applying for a small agentic engineering grant to package the current devnet prototype into a reproducible verification pack, contributor runbook, and reviewable evidence artifact.

### 100-word version

Relay is building a shielded RFQ layer for illiquid and vesting-linked assets on Solana. The repo already contains a working devnet flow, local passing typecheck/tests, and a documented architecture for keeping pricing and deal constraints confidential inside PER/TEE execution while settling public ownership on Solana. I am not pitching this grant as funding for the whole protocol. I am pitching a narrowly scoped one-week agentic engineering sprint to produce a reusable verification pack: reproducible devnet evidence, contributor runbooks, cleaner protocol explanation, and an explicit hardening checklist so reviewers and future contributors can evaluate Relay quickly and accurately.

### "Why should we fund this?" version

You should fund this because it converts a technically interesting but dense Solana privacy prototype into a compact public engineering asset. The result is useful beyond this repo: it demonstrates how to present, verify, and harden confidential-execution workflows on Solana in a way that is inspectable by other builders.

## Links And Repo Evidence To Include

- Repo root: [README.md](/C:/Users/ezevi/Documents/Relay/README.md)
- Architecture narrative: [Relay_Whitepaper.md](/C:/Users/ezevi/Documents/Relay/Relay_Whitepaper.md)
- Devnet proof: [DEVNET_E2E.md](/C:/Users/ezevi/Documents/Relay/DEVNET_E2E.md)
- Production roadmap: [PRODUCTION_READINESS_PLAN.md](/C:/Users/ezevi/Documents/Relay/PRODUCTION_READINESS_PLAN.md)
- Security posture: [smart_contract_audit.md](/C:/Users/ezevi/Documents/Relay/smart_contract_audit.md)
- Client flow: [clients/rfq-protocol.ts](/C:/Users/ezevi/Documents/Relay/clients/rfq-protocol.ts)
- API surface: [server/index.ts](/C:/Users/ezevi/Documents/Relay/server/index.ts)

## Recommended Submission Notes

- Do not present Relay as mainnet-ready.
- Do present it as a real prototype with devnet proof and a clear hardening path.
- Keep the ask small and milestone-based.
- Emphasize that the grant output is reusable engineering clarity, not vague future plans.

## Codex Verification Note

The Superstack installer did not populate the Codex-visible Windows skill path for this session.

What I verified locally:

- `C:\Users\ezevi\.codex\skills` currently shows only built-in `.system` skills
- `C:\Users\ezevi\.agents\skills` currently contains `colosseum-copilot` and `find-skills`
- no `~/.superstack/manifest.json` was present in the Windows home visible to this session

So for this environment, the install cannot be considered verified for Codex specifically.
