import { Link } from "react-router-dom";
import RoadMapComponents from "../components/RoadMapComponents";
import ContactSectionComponents from "../components/contactUsComponents";
import HeroSectionComponents from "../components/heroSectionComponents";
import OurTokennomicsComponents from "../components/ourtokenNomicsComponents";
import UsecasesComponents from "../components/usecasesComponents";

import Medium from '../assets/images/Medium.png';
import Telegram from '../assets/images/telegram.png';
import Twitter from '../assets/images/twitter.png';
import Discord from '../assets/images/discord.png';
import MainpurposeComponents from "../components/mainPurposeComponents";
import HeaderComponents from "../components/headerComponents";

const SHOW_TEAM_SECTION = false;


const LandingPage = () => {

    return (

        <div>

            <HeaderComponents/>

            <HeroSectionComponents/>

            <div className="landing_page_oth" >

                <MainpurposeComponents/>

                <UsecasesComponents/>

                <RoadMapComponents/>

                {SHOW_TEAM_SECTION && <OurTokennomicsComponents/>}

                <ContactSectionComponents/>

            </div>

            <footer>

                <div className="footer_left" >
                    <div className="footer_left_c" >
                        c
                    </div>
                    2026.RELAY
                </div>

                <div className="footer_right" >
                </div>

            </footer>

        </div>

    );

}


export default LandingPage;
