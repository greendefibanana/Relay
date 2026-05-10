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
            message: "Relay bridges the gap between the speed of Solana and the discretion of traditional finance. By utilizing Private Ephemeral Rollups (PERs), we enable users to negotiate and match orders in total privacy, revealing only the final ownership change on the public ledger. Your alpha stays yours." 
        },
        { 
            img: VoteImg, 
            title: "Solving the \"Locked Capital\" Trap", 
            message: "Billions are trapped in private vesting contracts, SAFTs, and SAFEs. Relay transforms these illiquid assets into tradable positions. Sellers can liquidate portions of their holdings without signaling \"insider dumping\" to the public market, while buyers gain decentralized access to exclusive private terms." 
        },
        { 
            img: BoostImg, 
            title: "The Relay Match Protocol (RMP)", 
            message: "We’ve moved the matching engine into high-speed, hardware-secured TEE enclaves. By processing orders off-chain in a \"Confidential Session,\" we eliminate front-running and MEV extraction entirely. Predators are starved, and users are protected by cryptographic execution guarantees." 
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