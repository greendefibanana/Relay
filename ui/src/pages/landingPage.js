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



const LandingPage = () => {

    return (

        <div>

            <HeaderComponents/>

            <HeroSectionComponents/>

            <div className="landing_page_oth" >

                <MainpurposeComponents/>

                <UsecasesComponents/>

                <RoadMapComponents/>

                <OurTokennomicsComponents/>

                <ContactSectionComponents/>

            </div>

            <footer>

                <div className="footer_left" >
                    <div className="footer_left_c" >
                        c
                    </div>
                    2023.RELAY
                </div>

                <div className="footer_right" >

                    <Link to="/" >
                        <img src={Medium} alt="medium" />
                        <h5>Meduim</h5>
                    </Link>

                    <Link to="/" >
                        <img src={Telegram} alt="Telegram" />
                        <h5>Telegram</h5>
                    </Link>

                    <Link to="/" >
                        <img src={Twitter} alt="twitter" />
                        <h5>Twitter</h5>
                    </Link>

                    <Link to="/" >
                        <img src={Discord} alt="discord" />
                        <h5>Discord</h5>
                    </Link>

                </div>

            </footer>

        </div>

    );

}


export default LandingPage;