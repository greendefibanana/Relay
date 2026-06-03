import UnderlineImg from '../assets/images/underline.png';
import LockImg from '../assets/images/lock.png';
import VoteImg from '../assets/images/vote.png';
import BoostImg from '../assets/images/boost.png';
import {  motion } from 'framer-motion';

const MainpurposeComponents = () => {

    const Details = [
        { img: LockImg, title:"Unlocking Liquidity for veTokens", message: `VeTokens, also known as vote-escrowed tokens, 
        have been synonymous with decentralized governance 
        but faced liquidity challenges. Relay, an Over-The-Counter 
        (OTC) P2P trading solution, transforms this narrative by 
        providing immediate liquidity. Sellers can now unlock 
        the intrinsic value of their assets without waiting 
        for lockup periods to expire, offering new financial possibilities.` },

        { img: VoteImg, title:"Enhancing Voting Power", message: `Buyers using Relay can acquire veTokens at below-market prices, 
        enhancing their voting power within decentralized governance 
        structures cost-effectively. This approach fosters a more 
        decentralized and inclusive distribution of voting power, 
        benefiting the entire ecosystem.` },

        { img: BoostImg, title:"Boosting Confidence and Liquidity", message: `Relay's impact extends beyond individual users. 
        By enabling OTC trading of veTokens, 
        it boosts confidence in this asset class, 
        attracting more participants to veToken governance. 
        This increase in participation and liquidity creates 
        a virtuous cycle, reinforcing the value of veTokens 
        and attracting additional resources to decentralized ecosystems.` },
    ]

    return (

        <div className='our_purpose_home' >

            <div className='our_purpose_home_1'  >

                <div className="our_purpose_home_header" >

                    <h5>Our <span>Main Purpose</span>
                    
                        <img src={UnderlineImg} alt="underline" />

                    </h5>

                </div>


                <div className='our_purpose_home_main' >

                    { Details.map( ( det, index ) => {
                        return (

                            <motion.div 
                                key={index}
                                className='our_purpose_home_main_div'  
                                initial={{ scaleX: 0, transformOrigin: '0% 0%', }}
                                whileInView={{ scaleX: 1, transformOrigin: '0% 0%' }}
                                transition={{ duration: 0.4 }}
                                viewport={{ once: true }}
                            >
                                <img alt='' src={det.img} />

                                <h5>{det.title}</h5>

                                <h6>{det.message}</h6>

                            </motion.div>

                        )
                    } ) }

                </div>

            </div>

        </div>

    );

}

export default MainpurposeComponents;