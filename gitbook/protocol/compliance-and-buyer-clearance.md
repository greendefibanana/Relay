# Compliance and BuyerClearance

Relay uses `BuyerClearance` to enforce eligibility before matching.

## Why Clearance Exists

Private secondary transfers and OTC trades often have counterparty requirements:

- Accredited investor checks.
- Qualified purchaser checks.
- Non-US person restrictions.
- Issuer-approved buyer lists.
- Listing-specific restrictions.
- Settlement readiness requirements.

Relay models these requirements as protocol state.

## Clearance Types

The current clearance model supports:

| ID | Clearance type |
| --- | --- |
| 1 | Accredited Investor |
| 2 | Qualified Purchaser |
| 3 | Non-US Person |

## Listing Scope

Clearance can be scoped to a listing. This allows a buyer to be cleared for one transaction without becoming globally cleared across all listings.

## V1 Status

Relay v1 uses an allowlisted buyer-clearance primitive. The demo and review modes may auto-issue clearance for test wallets, but the protocol path still requires a real `BuyerClearance` component before `match_offer` can execute.

External KYC provider integrations are future work.

## Important Note

Relay provides infrastructure for programmable transfer controls. It does not itself provide legal advice, broker-dealer services, or a guarantee that a transfer is compliant in every jurisdiction.
