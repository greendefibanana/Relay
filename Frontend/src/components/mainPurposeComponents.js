import UnderlineImg from '../assets/images/underline.png';
import LockImg from '../assets/images/lock.png';
import VoteImg from '../assets/images/vote.png';
import BoostImg from '../assets/images/boost.png';
import {  motion } from 'framer-motion';

const MainpurposeComponents = () => {

    const Details = [
        {
            img: LockImg,
            title: "Shielded Execution, Public Settlement",
            message: "Relay connects Solana settlement with the discretion expected in institutional OTC markets. Private Ephemeral Rollups (PERs) let counterparties negotiate and match orders confidentially, revealing only the final ownership change on the public ledger."
        },
        {
            img: VoteImg,
            title: "Secondary and OTC Liquidity",
            message: "Relay supports private secondary markets for SAFTs, SAFEs, vested tokens, and locked allocations, while also supporting confidential block trades, treasury OTC sales, and whale-to-whale token deals."
        },
        {
            img: BoostImg,
            title: "The Relay Match Protocol (RMP)",
            message: "Relay moves RFQ matching into hardware-secured TEE enclaves. Projects, market makers, desks, and private buyers can coordinate pricing and allocations with reduced information leakage before atomic settlement on Solana."
        },
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
