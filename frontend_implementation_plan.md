# Relay Frontend — E2E Production-Ready Extension

Extend the existing dapp UI to cover every feature the protocol exposes (list, browse, match, clearance, settlement, consent, staking/portfolio) and polish every page to a production-ready standard — matching the existing **Syne + Raleway** fonts and **purple → blue** gradient theme.

---

## Proposed Changes

### API Client
#### [MODIFY] [rfq-client.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/lib/rfq-client.js)
- Add `cancelListing(tradeId)` → `DELETE /api/listings/:id`  
- Add `getPortfolio(wallet)` → `GET /api/listings?seller=wallet` (client-side filter)

---

### New Pages & Routes

#### [NEW] [dapp.dashboard.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/dapp.dashboard.js)
A portfolio/dashboard page showing:
- **Stats bar**: Total listings, active listings, matched count (derived from API data)
- **My Listings**: Listings where `owner === user_account` — with inline Cancel button wired to `cancelListing()`  
- **My Clearance Status**: `ClearanceBadge` pulled from [getClearanceStatus(wallet)](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/lib/rfq-client.js#70-74) with a direct "Get Clearance" CTA
- **Activity Feed**: All listings sorted by most-recent, truncated to 5, with links to their detail pages  
- Empty-state when wallet is not connected  

#### [NEW] [dapp.dashboard.scss](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/sass/dapp/dapp.dashboard.scss)
Styles for stats cards, activity feed rows, portfolio grid.

---

### Sidebar ([dapp.index.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/dapp.index.js) / [dapp.index.scss](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/sass/dapp/dapp.index.scss))
#### [MODIFY] [dapp.index.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/dapp.index.js)
- Replace emoji icons with `react-icons` (BsGrid, BsArrowLeftRight, BsPlusCircle, BsCurrencyDollar)
- Add **Dashboard** NavLink → `/dashboard`
- Add **Staking** NavLink → `/staking`
- Add a live **network status chip** (green dot + "Solana Devnet") at sidebar bottom above wallet button
- Duplicate in mobile sidenav

#### [MODIFY] [dapp.index.scss](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/sass/dapp/dapp.index.scss)
- Nav link icons inline-flex with `gap`
- Active link: left border accent `3px solid #0097FF` instead of just bg change
- Network chip styles

---

### Secondary Market ([dapp.otc.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/dapp.otc.js))
#### [MODIFY] [dapp.otc.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/dapp.otc.js)
- Add a **search input** that filters by asset type substring
- Replace the flat body loop with a responsive CSS grid (`auto-fill, minmax(300px,1fr)`)
- Show **skeleton cards** (3 animated placeholders) while loading
- Add a **Refresh** button (icon) next to the filter row

#### [MODIFY] [dapp.otc.scss](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/sass/dapp/dapp.otc.scss)
- Skeleton card pulse animation
- Search bar styles

---

### List Private Agreement ([dapp.setuptrade.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/dapp.setuptrade.js))
#### [MODIFY] [dapp.setuptrade.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/dapp.setuptrade.js)
- Group fields into **Section cards**: "Asset Info", "Pricing", "Vesting Details", "Settlement & Compliance"
- Move labels **above** inputs (not inline) for readability
- Show a **live fee preview** line: `Min Price × 1.5% = X lamports`
- Auto-fill `settlementExpiresAt` with a "+30 days" helper button
- Scroll to TxStatusPanel on start

---

### Trade Detail ([Trade.otc.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/Trade.otc.js))
#### [MODIFY] [Trade.otc.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/Trade.otc.js)
- Add a `← Back to Market` link at the top
- Show a **vesting timeline bar** (start → cliff → end) when [isVestingAsset](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/Trade.otc.js#58-59)
- Add a **copy-to-clipboard** button for PDA addresses
- Improve the action button flow: show a step-by-step checklist of what's needed before Match Offer becomes enabled

---

### Staking Page ([dapp.stakings.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/dapp.stakings.js))
#### [MODIFY] [dapp.stakings.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/dapp/dapp.stakings.js)
- Wire **Token Holding** to show `displayAccount` and a "not connected" placeholder
- Disable Stake/Claim buttons when not connected, clicking prompts `enableWeb3()`
- Add a **"Staking coming soon"** banner with expected launch info
- Add a real empty reward history message instead of hardcoded dates

---

### App.js
#### [MODIFY] [App.js](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/App.js)
- Add `/dashboard` route → `DashboardDapp`

### main.scss
#### [MODIFY] [main.scss](file:///c:/Users/ezevi/Documents/Relay/Frontend/src/sass/main.scss)
- Import `dapp.dashboard.scss`

---

## Verification Plan

### Manual Verification (run `npm start` in `Frontend/`)
1. **Dashboard page**: Navigate to `/dashboard` — stats bar renders, "My Listings" shows if wallet connected, clearance badge shows
2. **Sidebar**: All 4 nav items visible, icons show, active tab has left-border accent, network chip shows
3. **Listings page**: Search box filters cards by asset type string; skeletons show during load; refresh button re-fetches
4. **SetupTrade**: Section cards visible; live fee preview updates as minPrice changes; form still submits correctly
5. **Trade Detail**: Back link present; vesting timeline visible on vesting-type listings; clipboard buttons work
6. **Staking**: Wallet balance area shows connected address or "Not connected"; Stake disabled/enabled by wallet state
7. **Responsive**: At ≤787px sidebar collapses, hamburger shows mobile nav
