import UnderlineImg from '../assets/images/underline.png';
import ActiveImg from '../assets/images/Active.png';
import ActiveIm2 from '../assets/images/Active2.png';
import ActiveIm3 from '../assets/images/Active3.png';
import Fline from '../assets/images/draw.png';
import Fline2 from '../assets/images/line2.png';
import { BsFastForwardFill } from 'react-icons/bs';
import EclipseImg from '../assets/images/Ellipse_1.png';
import SporalImg from '../assets/images/hero_spiral.png'

const RoadMapComponents = () => {

    return (

        <div className='our_road_map' >

            <div className="our_road_map_header" >

                <h5>Our <span>Roadmap</span>
                    <img src={UnderlineImg} alt="underline" />
                </h5>

            </div>

            <div className='our_road_map_body' >

                <div className='our_road_map_body_div' >

                    <div className='our_road_map_body_div_top' >
                        <h5 className='our_road_map_body_div_top_title' >Q4 2023</h5>
                        <img className='' src={ActiveImg} alt='active' />
                        <img className='our_road_map_body_div_top_line' src={Fline} alt='line' />
                    </div>

                    <div className='our_road_map_body_div_list' >

                        <div className='our_road_map_body_div_list_li' >
                            <BsFastForwardFill className='our_road_map_body_div_list_li_ic' color='#0D1019' />
                        </div>

                        <h5>Cross-Chain Support</h5>

                    </div>

                    <div className='our_road_map_body_div_list' >

                        <div className='our_road_map_body_div_list_li' >
                            <BsFastForwardFill className='our_road_map_body_div_list_li_ic' color='#0D1019' />
                        </div>

                        <h5>Partnerships/Marketing</h5>

                    </div>

                    <div className='our_road_map_body_div_list' >

                        <div className='our_road_map_body_div_list_li' >
                            <BsFastForwardFill className='our_road_map_body_div_list_li_ic' color='#0D1019' />
                        </div>

                        <h5>Dapp and Token Launch</h5>

                    </div>

                </div>


                <div className='our_road_map_body_div' >

                    <div className='our_road_map_body_div_top' >
                        <h5 className='our_road_map_body_div_top_title' >Q1 2024</h5>
                        <img className='' src={ActiveIm2} alt='active' />
                        <img className='our_road_map_body_div_top_line' src={Fline2} alt='line' />
                    </div>

                    <div className='our_road_map_body_div_list' >

                        <div className='our_road_map_body_div_list_li div_list_li2' >
                            <BsFastForwardFill className='our_road_map_body_div_list_li_ic' color='#0D1019' />
                        </div>

                        <h5>Dedicated Marketplace for veTokens</h5>

                    </div>

                    <div className='our_road_map_body_div_list' >

                        <div className='our_road_map_body_div_list_li div_list_li2' >
                            <BsFastForwardFill className='our_road_map_body_div_list_li_ic' color='#0D1019' />
                        </div>

                        <h5>New Features like In-House Launchpad 
                            and Custom Escrows</h5>

                    </div>

                    <div className='our_road_map_body_div_list' >

                        <div className='our_road_map_body_div_list_li div_list_li2' >
                            <BsFastForwardFill className='our_road_map_body_div_list_li_ic' color='#0D1019' />
                        </div>

                        <h5>CEX Listings</h5>

                    </div>

                </div>

                <div className='our_road_map_body_div' >

                    <div className='our_road_map_body_div_top' >
                        <h5 className='our_road_map_body_div_top_title' >Q2 2024</h5>
                        <img className='' src={ActiveIm3} alt='active' />
                    </div>

                    <div className='our_road_map_body_div_list' >

                        <div className='our_road_map_body_div_list_li div_list_li3' >
                            <BsFastForwardFill className='our_road_map_body_div_list_li_ic' color='#0D1019' />
                        </div>

                        <h5>Introduction of a PWA <br/> Version of the Dapp</h5>

                    </div>

                </div>

            </div>

            <img src={EclipseImg} className='our_road_map_right_img' alt='hdtd' />
            <img src={EclipseImg} className='our_road_map_left_img' alt='hdtd' />
            <img src={SporalImg} className='our_road_map_right_img' alt='hdtd' />

        </div>

    );

}

export default RoadMapComponents;