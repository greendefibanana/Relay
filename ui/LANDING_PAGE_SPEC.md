# Relay dApp Landing Page Specification

This document provides the complete structure, components, and styling logic required to build the Relay landing page around an existing **Hero Section**.

## 1. Main Page Assembly (`LandingPage.js`)
The landing page is a vertical stack of components. The `landing_page_oth` class handles the background and padding for the sections following the Hero.

```javascript
import HeaderComponents from "../components/headerComponents";
import HeroSectionComponents from "../components/heroSectionComponents"; // EXISTING
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
            {/* Footer Logic */}
            <footer>
                <div className="footer_left"><div className="footer_left_c">c</div>2023.RELAY</div>
                <div className="footer_right">
                    <Link to="/"><img src={Medium} alt="medium" /><h5>Medium</h5></Link>
                    <Link to="/"><img src={Telegram} alt="Telegram" /><h5>Telegram</h5></Link>
                    <Link to="/"><img src={Twitter} alt="twitter" /><h5>Twitter</h5></Link>
                    <Link to="/"><img src={Discord} alt="discord" /><h5>Discord</h5></Link>
                </div>
            </footer>
        </div>
    );
}
```

## 2. Component Reference

### A. Navigation Header (`HeaderComponents.js`)
- **Features:** Logo, Nav Links (Trade, Stake, Docs), and "Open Dapp" button.
- **Mobile:** Uses a Popover menu (`@nextui-org/react`) with a hamburger icon (`MdDehaze`).

### B. Main Purpose Section (`MainpurposeComponents.js`)
- **Layout:** Three cards in a row.
- **Animation:** Uses `framer-motion` for a `scaleX` entrance from left-to-right when in view.
- **Content:** 
  1. Unlocking Liquidity (Lock icon)
  2. Enhancing Voting Power (Vote icon)
  3. Boosting Confidence (Boost icon)

### C. Features/Use Cases (`UsecasesComponents.js`)
- **Layout:** A 3-column layout: Left text cards, Center Image (`use_case.png`), Right text cards.
- **Features:** "New Market Approach", "Large Volume Transactions", "Price Negotiation", "Strategic Integrations".

### D. Roadmap (`RoadMapComponents.js`)
- **Layout:** Horizontal timeline for Q4 2023, Q1 2024, Q2 2024.
- **Visuals:** Uses `draw.png` and `line2.png` as connectors between phases. Icons: `BsFastForwardFill`.

### E. Tokenomics (`OurTokennomicsComponents.js`)
- **Data:** 
  - Staking Rewards: 20%
  - Initial Liquidity: 18.5%
  - Private Sale: 17.5%
  - Public Sale: 19%
  - Treasury: 10%
  - Team: 15%
- **Visualization:** Horizontal progress bars animated with `framer-motion`.
- **Token Details:** $RLY, 50,000,000 Supply, 3% Tax.

### F. Call to Action (`ContactSectionComponents.js`)
- **Content:** Large "Relay" title and a "Try Now" button linking to `/setuptrade`.

## 3. Global Styles & Variables (SASS)
Ensure these CSS variables are defined in your global stylesheet:

```scss
:root {
    --background_color: #0D1019;
    --header_bg_color: rgba(0, 0, 0, 1);
    --raleway: 'Raleway', sans-serif;
    --syne: 'Syne', sans-serif;
    --white_color: #fff;
    --linearBg: linear-gradient(70deg, #7900D9 16.65%, #0097FF 78.93%);
}

.landing_page_oth {
    padding-bottom: 4rem;
    overflow-x: hidden;
}

footer {
    padding: 10px 3rem;
    background-color: #131020;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
}
```

## 4. Required Assets List
- **Images:** `underline.png`, `lock.png`, `vote.png`, `boost.png`, `use_case.png`, `Active.png`, `draw.png`, `line2.png`, `Ellipse.png`, `right_img_.png`.
- **Icons:** `react-icons/bs` (BsFastForwardFill), `react-icons/md` (MdDehaze).
- **Libraries:** `framer-motion`, `@nextui-org/react`, `react-router-dom`.
