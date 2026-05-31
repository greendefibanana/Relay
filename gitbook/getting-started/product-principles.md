# Product Principles

Relay is designed around four principles.

## 1. Privacy Before Settlement

Sensitive negotiation data should not become public before execution.

Relay keeps price constraints, bid ranges, vesting data, buyer restrictions, and RFQ terms inside confidential components.

## 2. Public Settlement Where It Matters

Final ownership updates should be verifiable.

Relay commits settlement state back to Solana through public component state while keeping private terms shielded.

## 3. Compliance as Execution Logic

Eligibility should be enforced before matching.

Relay uses `BuyerClearance` and settlement policy components so transfer controls can be checked inside the private execution environment.

## 4. Infrastructure Should Disappear

Institutional users should not manage every setup transaction manually.

Relay uses a relayer pattern to abstract BOLT entity creation, component setup, and delegation flow while preserving non-custodial execution.
