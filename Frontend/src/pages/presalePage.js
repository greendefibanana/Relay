import ClaimTokenComponent from "../components/claimToken";
import PresaleHeroSection from "../components/presaleHeroSectionComponents ";
import PublicSaleComponent from "../components/publicSale";
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

            <footer>

                <div className="footer_left" >
                    <div className="footer_left_c" >
                        c
                    </div>
                    2026.RELAY
                </div>

            </footer>

        </div>
    )

}

export default PresalePage;
