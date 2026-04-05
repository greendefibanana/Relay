import HeroBg from '../assets/images/hero_bg.png';
import roundImg from '../assets/images/hero_vector.png'
import HeroSprial from '../assets/images/hero_spiral.png'
import { Link } from 'react-router-dom';

const HeroSectionComponents = () => {

    return (

        <div className='hero_section' >

            <div className="hero_section_main" >
                
                <div className="hero_section_main_center" >

                    <div className="hero_section_main_center_txt" >

                        <h5>
                            Private Secondary Market for
                            SAFTs, SAFEs, and vesting contracts powered 
                            <h5 style={{position:"relative"}} >  by Solana PERs.
                                <img src={roundImg} alt='vexxf' />
                            </h5>
                        </h5>


                    </div>

                        <Link to="/setuptrade" className="hero_section_main_center_btn" >
                            Open Dapp
                        </Link>

                </div>

                <div className="hero_section_main_relay" >
                    <h5>R</h5>
                    <h5>E</h5>
                    <h5>L</h5>
                    <h5>A</h5>
                    <h5>Y</h5>
                </div>

            </div>

            <img src={HeroBg} alt='hero_bg' className='hero_section_bg' />
            <img src={HeroSprial} alt='hero_sg' className='hero_section_spiral' />

        </div>

    );

}

export default HeroSectionComponents;
