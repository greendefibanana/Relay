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
                            Relay uses BOLT ECS to split public ownership state from private deal logic.
                            AssetRegistry records settlement state, while DealTerms keeps prices, caps,
                            vesting schedules, block sizes, and buyer constraints inside private components.
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
                            BuyerClearance components support issuer, treasury, and desk requirements
                            before a match executes. KYC, accreditation, transfer restrictions, and
                            counterparty eligibility can be evaluated inside the TEE without public exposure.
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

                        <h5 className='use_case_home_Fpart_div_title' >Private OTC Block Trades:</h5>

                        <h6>
                            Relay supports confidential negotiation for liquid token blocks, treasury
                            sales, whale-to-whale deals, and market maker/project OTC coordination.
                            Counterparties can discover price without broadcasting size or intent.
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
                            but the specific terms remain shielded. It combines confidential negotiation,
                            reduced information leakage, and public settlement assurance.
                        </h6>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default UsecasesComponents;
