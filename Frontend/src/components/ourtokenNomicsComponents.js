import UnderlineImg from '../assets/images/underline.png';
import EclipseImg from '../assets/images/Ellipse.png';
import RightImg from '../assets/images/right_img_.png';
import RightEcliImg from '../assets/images/Ellipse_28.png';
import LeftEcliImg from '../assets/images/Ellipse_29.png';
import {  motion } from 'framer-motion';


const OurTokennomicsComponents = () => {

    const Details = [
        { name: "Gani", role: "Cofounder and BD", detail: "" },
        { name: "Victor", role: "Cofounder and Lead Architect", detail: "" },
        { name: "Kei", role: "Community", detail: "" },
        { name: "Macmillan", role: "Design", detail: "" },
    ]

    return (

        <div className='our_tokenNomics_div' >

            <div className="our_tokenNomics_div_header" >

                <h5>Our <span>Team</span>
                
                    <img src={UnderlineImg} alt="underline" />

                </h5>

            </div>

            <div className='our_tokenNomics_div_body' style={{ width: '60%' }} >

                { Details.map( (det,index) => {
                    return (

                    <div className='our_tokenNomics_div_body_div' key={index} >

                        <div className='our_tokenNomics_div_body_div_top' >
                            <h5>{det.name}</h5>
                            <h6 style={{ fontSize: '0.9rem', color: '#0097FF' }} >{det.role}</h6>
                        </div>

                        <div className='our_tokenNomics_div_body_div_btm' style={{ height: 'auto', background: 'transparent' }} >
                             <p style={{ color: '#E1E1E3', fontFamily: 'var(--raleway)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                {det.detail}
                             </p>
                        </div>

                    </div>

                    );
                } ) }

            </div>

            <div className='our_tokenNomics_div_btm' >

                <div className='our_tokenNomics_div_btm_sec' >
                    <h5>Project:</h5>
                    <h6>Relay</h6>
                </div>

                <div className='our_tokenNomics_div_btm_sec' >
                    <h5>Stack:</h5>
                    <h6>Solana / BOLT</h6>
                </div>

                <div className='our_tokenNomics_div_btm_sec' >
                    <h5>Protocol:</h5>
                    <h6>Shielded RFQ</h6>
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