import { Link } from 'react-router-dom';
import {IoMdMenu} from 'react-icons/io';
import {ErrorModal, SelectTokenBdrop} from '../components/backDropComponent';
import { useContext, useState } from 'react';
import AppContext from '../context/Appcontext';


const StakingPage = ({closeHeader}) => {

    const [ openModal, setopenModal ] = useState(false)
    const [ openMessage, setopenMessage ] = useState(false)
    const { enableWeb3, displayAccount } = useContext(AppContext)


    return (

        <div className="Otc_main" >

            <div className="Otc_main_header" >

                <h5>STAKING</h5>

                <div className='Otc_main_header_spc' >
                    
                    <IoMdMenu className='Otc_main_header_spc_ic' style={{
                        cursor:"pointer"
                    }} onClick={closeHeader} />

                    <Link className='Otc_main_header_spc_txt' to={'/trades'} >RELAY</Link>

                </div>

                <div className="Otc_main_header_right" >

                    <div className="Otc_main_header_right_wallet otc_tophdvgt" >
                    { displayAccount 
                            
                            ? 
                            
                            <div className="Otc_main_header_right_wallet_center" >{displayAccount}</div> 

                            :
                        
                            <div className="Otc_main_header_right_wallet_center" style={{
                                cursor:"pointer"
                            }} onClick={ () => enableWeb3() } >Connect Wallet</div> 
                            
                    }
                    </div> 

                </div>

            </div>

            <div className='Otc_main_body' >

                <div className='stake_t_holding' >

                    <h6 className='stake_t_holding_title' >Token Holding</h6>

                    <div className='stake_t_holding_wal' >
                        <h5 className='stake_t_holding_wal_wallet' >Wallet:</h5>
                        <h6 className='stake_t_holding_wal_value' >1222.1222</h6>
                    </div>

                </div>

                <div className='stake_t_holding' >

                    <h6 className='stake_t_holding_title' >Stake $RLY</h6>

                    <div className='stake_t_holding_split' >

                        <div className='stake_t_holding_split_left' >
                            <h5 className='stake_t_holding_split_left_wallet' >0.00</h5>
                            <h6 className='stake_t_holding_split_left_value' >MAX</h6>
                        </div>

                        <div className='stake_t_holding_split_right' >

                            <button>
                                Approve
                            </button>

                            <button>
                                Stake
                            </button>

                        </div>

                    </div>

                </div>

                <div className='stake_t_holding' >

                    <h6 className='stake_t_holding_title' >Claim rewards</h6>

                    <h6 className='stake_t_holding_subTitle' >Holders Reward</h6>

                    <div className='stake_t_holding_split' >

                        <div className='stake_t_holding_split_left' >
                            <h5 className='stake_t_holding_split_left_wallet' >Accumulated Rewards:</h5>
                            <h6 className='stake_t_holding_split_left_value' >1222.1222</h6>
                        </div>

                        <div className='stake_t_holding_split_right' >

                            <button>
                                Approve
                            </button>

                            <button>
                                Claim
                            </button>

                        </div>

                    </div>

                    <h6 className='stake_t_holding_title' style={{
                        marginTop:"2rem"
                    }} >Reward History</h6>

                    <h6 className='stake_t_holding_subTitle' >Holders Reward History</h6>

                    
                    <div className='covering' >
                    <div className='stake_t_holding_tableTop' >
                        <div className='stake_t_holding_tableTop_div' >Time</div>
                        <div className='stake_t_holding_tableTop_div' >Rewards From Protocol</div>
                        <div className='stake_t_holding_tableTop_div' >Rewards From Token Tax</div>
                    </div>

                    <div className='stake_t_holding_body' >
                        <div className='stake_t_holding_tableTop_div' >2023-10-11 09:37:59</div>
                        <div className='stake_t_holding_tableTop_div' >0.00001</div>
                        <div className='stake_t_holding_tableTop_div' >0.00002</div>
                    </div>

                    <div className='stake_t_holding_body' >
                        <div className='stake_t_holding_tableTop_div' >2023-10-11 09:37:59</div>
                        <div className='stake_t_holding_tableTop_div' >0.00001</div>
                        <div className='stake_t_holding_tableTop_div' >0.00002</div>
                    </div>

                    <div className='stake_t_holding_body' >
                        <div className='stake_t_holding_tableTop_div' >2023-10-11 09:37:59</div>
                        <div className='stake_t_holding_tableTop_div' >0.00001</div>
                        <div className='stake_t_holding_tableTop_div' >0.00002</div>
                    </div>

                    <div className='stake_t_holding_body' >
                        <div className='stake_t_holding_tableTop_div' >2023-10-11 09:37:59</div>
                        <div className='stake_t_holding_tableTop_div' >0.00001</div>
                        <div className='stake_t_holding_tableTop_div' >0.00002</div>
                    </div>

                    </div>

                </div>

            </div>

            { openModal ? 
            
                <SelectTokenBdrop closeModal={ () => {
                    setopenModal(false)
                    setopenMessage(false)
                } } />

            : <></> }

            { openMessage ? 
                
                <ErrorModal closeModal={ () => {
                    setopenMessage(false)
                    setopenModal(false)
                } } />

            : <></> }

        </div>

    );

}

export default StakingPage;