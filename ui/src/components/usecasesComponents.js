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

                <h5>More <span>Features</span>
                
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

                        <h5 className='use_case_home_Fpart_div_title' >Pioneering a New Market Approach:</h5>

                        <h6>
                            Relay introduces an innovative and transformative approach 
                            that addresses the longstanding challenge of 
                            liquidity within the veTokens market.
                        </h6>

                    </div>

                    <div className='use_case_home_Fpart_div' >

                        <div className='use_case_home_Fpart_div_top' >
                            <img src={pricImg} alt='trade' className='' />
                            <div className='use_case_home_Fpart_div_top_cover' >

                            </div>
                        </div>

                        <h5 className='use_case_home_Fpart_div_title' >Facilitating Large Volume Transactions:</h5>

                        <h6>
                            In the realm of Over-The-Counter (OTC) trades, 
                            Relay offers a trusted platform for institutional investors, 
                            high-net-worth UI Fixes v1 4 individuals, 
                            and businesses to execute substantial transactions securely. 
                            By doing so, they can effectively mitigate market 
                            slippage and minimize the impact of 
                            their trades on prevailing market prices.
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

                        <h5 className='use_case_home_Fpart_div_title' >Efficient Price Negotiation:</h5>

                        <h6>
                            Relay empowers both buyers and sellers with the ability 
                            to negotiate prices swiftly, streamlining the trade setup process 
                            to under 30 seconds. This feature proves particularly 
                            valuable when engaging with illiquid 
                            assets or unique trading conditions.
                        </h6>

                    </div>

                    <div className='use_case_home_Fpart_div' >

                        <div className='use_case_home_Fpart_div_top' >
                            <img src={ShildImg} alt='trade' className='' />
                            <div className='use_case_home_Fpart_div_top_cover' >

                            </div>
                        </div>

                        <h5 className='use_case_home_Fpart_div_title' >Strategic Integrations:</h5>

                        <h6>
                            Our primary focus revolves around expanding 
                            our reach through strategic partnerships 
                            and seamless backend integrations with 
                            leading protocols. This commitment 
                            ensures an unparalleled user experience, 
                            enhancing the overall efficiency of 
                            the trading process. <span style={{
                                textDecoration:"underline"
                            }} >Learn more</span>
                        </h6>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default UsecasesComponents;