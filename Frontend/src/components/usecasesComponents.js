import UnderlineImg from '../assets/images/underline.png';
import MoneyImg from '../assets/images/grommet-icons_money.png';
import TradeImg from '../assets/images/game-icons_trade.png';
import UsecaseImg from '../assets/images/use_case.png';
import pricImg from '../assets/images/ic_twotone-price-check.png';
import ShildImg from '../assets/images/shild.png';

const UsecasesComponents = () => {

    return (

        <div className='use_case_home' >

            <div className="use_case_home_header" >

                <h5>Protocol <span>Features</span>
                
                    <img src={UnderlineImg} alt="underline" />

                </h5>

            </div>


            <div className='use_case_home_contain' >

                <div className='use_case_home_Fpart' >

                    <div className='use_case_home_Fpart_div' >

                        <div className='use_case_home_Fpart_div_top' >
                            <img src={MoneyImg} alt='money' className='' />
                            <div className='use_case_home_Fpart_div_top_cover' >

                            </div>
                        </div>

                        <h5 className='use_case_home_Fpart_div_title' >BOLT ECS Architecture:</h5>

                        <h6>
                            We’ve engineered a sophisticated state-split using the BOLT framework. 
                            Public registries confirm asset existence, while sensitive deal terms—like strike prices 
                            and vesting schedules—are encrypted and managed within private components.
                        </h6>

                    </div>

                    <div className='use_case_home_Fpart_div' >

                        <div className='use_case_home_Fpart_div_top' >
                            <img src={pricImg} alt='trade' className='' />
                            <div className='use_case_home_Fpart_div_top_cover' >

                            </div>
                        </div>

                        <h5 className='use_case_home_Fpart_div_title' >TEE-Based Whitelisting:</h5>

                        <h6>
                            Institutional capital requires unyielding compliance. Relay introduces 
                            programmatic BuyerClearance components. KYC and accreditation checks 
                            are enforced inside the TEE before any match occurs, giving issuers 
                            absolute control without public exposure.
                        </h6>

                    </div>

                </div>

                <img src={UsecaseImg} alt='dhyd' className='use_case_home_img' />

                <div className='use_case_home_Fpart' >

                    <div className='use_case_home_Fpart_div' >

                        <div className='use_case_home_Fpart_div_top' >
                            <img src={TradeImg} alt='money' className='' />
                            <div className='use_case_home_Fpart_div_top_cover' >

                            </div>
                        </div>

                        <h5 className='use_case_home_Fpart_div_title' >High-Volume "Dark" Trades:</h5>

                        <h6>
                            Relay enables native Dark Pools on Solana. Large institutional blocks 
                            can be traded for SOL, JUP, or PYTH with zero market impact. 
                            By keeping the negotiation "in the dark," we prevent slippage 
                            and front-running.
                        </h6>

                    </div>

                    <div className='use_case_home_Fpart_div' >

                        <div className='use_case_home_Fpart_div_top' >
                            <img src={ShildImg} alt='trade' className='' />
                            <div className='use_case_home_Fpart_div_top_cover' >

                            </div>
                        </div>

                        <h5 className='use_case_home_Fpart_div_title' >Instant On-Chain Finality:</h5>

                        <h6>
                            Once a match is made inside our private rollup, Relay atomically 
                            updates ownership on the Solana mainnet. The public sees the transfer, 
                            but the specific terms remain permanently shielded. It’s the 
                            ultimate combination of private negotiation and public trust.
                        </h6>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default UsecasesComponents;