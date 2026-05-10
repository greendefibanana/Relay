import UnderlineImg from '../assets/images/underline.png';
import EclipseImg from '../assets/images/Ellipse.png';
import RightImg from '../assets/images/right_img_.png';
import RightEcliImg from '../assets/images/Ellipse_28.png';
import LeftEcliImg from '../assets/images/Ellipse_29.png';
import {  motion } from 'framer-motion';


const OurTokennomicsComponents = () => {

    const Details = [

        { title: "Staking Rewards", percentage: '20%' },
        { title: "Initial Liquidity", percentage: '18.5%' },
        { title: "Private Sale", percentage: '17.5%' },
        { title: "Public Sale", percentage: '19%' },
        { title: "Tresury", percentage: '10%' },
        { title: "Team", percentage: '15%' },

    ]

    return (

        <div className='our_tokenNomics_div' >

            <div className="our_tokenNomics_div_header" >

                <h5>Our <span>Tokenomics</span>
                
                    <img src={UnderlineImg} alt="underline" />

                </h5>

            </div>

            <div className='our_tokenNomics_div_body' >

                { Details.map( (det,index) => {
                    return (

                    <div className='our_tokenNomics_div_body_div' key={index} >

                        <div className='our_tokenNomics_div_body_div_top' >
                            <h5>{det.title}</h5>
                            <h6>{det.percentage}</h6>
                        </div>

                        <div className='our_tokenNomics_div_body_div_btm' >
                            <motion.div
                            
                            initial={{ width: '0%' }}
                            whileInView={{ width: det.percentage }}
                            transition={{ duration: 0.6 }}
                            // viewport={{ once: true }}

                            className='our_tokenNomics_div_body_div_btm_mid' style={{
                                width:det.percentage
                            }} ></motion.div>
                        </div>

                    </div>

                    );
                } ) }

            </div>

            <div className='our_tokenNomics_div_btm' >

                <div className='our_tokenNomics_div_btm_sec' >
                    <h5>Token Name:</h5>
                    <h6>$RLY</h6>
                </div>

                <div className='our_tokenNomics_div_btm_sec' >
                    <h5>Total Supply:</h5>
                    <h6>50,000,000</h6>
                </div>

                <div className='our_tokenNomics_div_btm_sec' >
                    <h5>Tax:</h5>
                    <h6>3%</h6>
                </div>

            </div>

            <img src={EclipseImg} alt="ss" className='our_tokenNomics_div_leftImg' />
            <img src={RightImg} alt="ss" className='our_tokenNomics_div_rightImg' />
            <img src={RightEcliImg} alt="ss" className='our_tokenNomics_div_miniRight' />
            <img src={LeftEcliImg} alt="ss" className='our_tokenNomics_div_miniLeft' />

        </div>

    );

}

export default OurTokennomicsComponents;