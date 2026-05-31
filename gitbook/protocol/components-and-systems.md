# Components and Systems

Relay is implemented with BOLT ECS components and systems.

## Components

### AssetRegistry

Public or settlement-facing ownership state.

Tracks:

- Owner.
- Asset type.
- Token mint where relevant.
- Token amount.
- Sale status.
- Settlement status.

### DealTerms

Confidential listing and negotiation state.

Tracks:

- Minimum price.
- Valuation cap.
- Vesting source.
- Vesting timestamps.
- Transfer restrictions.
- Settlement requirements.
- Consent requirements.
- Buyer designation for private listings.

### BuyerClearance

Confidential eligibility state for a buyer.

Tracks:

- Buyer.
- Clearance type.
- Issuer.
- Expiry.
- Listing scope.

### SettlementAuthorityPolicy

Controls which authorities can issue clearance or settlement attestations.

### PaymentRoutingPolicy

Controls fee routing and treasury accounts for settlement.

## Systems

### create_listing

Creates the listing state and initializes the relevant components.

### issue_clearance

Issues a `BuyerClearance` component for a buyer.

### attest_vesting_settlement

Marks settlement readiness for vesting-backed listings where an attestor is required.

### issue_transfer_consent

Issues consent for restricted-transfer workflows.

### match_offer

Evaluates a buyer offer against confidential terms and settlement constraints, then routes payment and updates settlement state.

### cancel_listing

Cancels a listing and handles the cancellation path for active state.
