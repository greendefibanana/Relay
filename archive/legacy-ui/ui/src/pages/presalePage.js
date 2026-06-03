import ClaimTokenComponent from "../components/claimToken";
import ContactSectionComponents2 from "../components/contactUsComponents2";
import PresaleHeroSection from "../components/presaleHeroSectionComponents ";
import PublicSaleComponent from "../components/publicSale";
import { Link } from "react-router-dom";
import Medium from '../assets/images/Medium.png';
import Telegram from '../assets/images/telegram.png';
import Twitter from '../assets/images/twitter.png';
import Discord from '../assets/images/discord.png';
import PresaleHeader from "../components/presaleHeader";

const PresalePage = () => {

    return (
        <div style={{
            border:"1px solid transparent"
        }} >

            <PresaleHeader/>

            <PresaleHeroSection/>

            <PublicSaleComponent/>

            <ClaimTokenComponent/>

            <ContactSectionComponents2/>

            <footer>

                <div className="footer_left" >
                    <div className="footer_left_c" >
                        c
                    </div>
                    2026.RELAY
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
    )

}

export default PresalePage;
