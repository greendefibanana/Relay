import HeroSectionComponents from "../components/heroSectionComponents";
import HeaderComponents from "../components/headerComponents";

const LandingPage = () => {
    return (
        <div>
            <HeaderComponents/>
            <HeroSectionComponents/>

            <footer>
                <div className="footer_left" >
                    <div className="footer_left_c" >
                        c
                    </div>
                    2023.RELAY
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
