import {AiOutlineClose,AiFillWarning} from 'react-icons/ai';
import {IoMdCheckmark} from 'react-icons/io';
import {BsFunnel} from 'react-icons/bs';
import {BiChevronDown, BiSearch, BiSolidCopy} from 'react-icons/bi';
import {  motion } from 'framer-motion';
import ETHimg from '../assets/images/eth.png';
import CloseImg from '../assets/images/close.png';
import { useEffect, useState } from 'react';
import { commonToken } from '../constants/tokens';
// import Moralis from 'moralis';
// import { EvmChain } from '@moralisweb3/common-evm-utils';
import CeleberationImg from '../assets/images/firework.png';
import CopyToClipboard from 'react-copy-to-clipboard';
import { ethers } from 'ethers';
import { useContext } from 'react';
import AppContext from '../context/Appcontext';
import { ERC20ABI, ERC721 } from '../constants/abi';
import { Spinner } from '@nextui-org/react';
import ComingSoonImg from '../assets/images/work-in-progress.png';



const BackDrop = ({closeModal}) => {

    return(

        <div className="backDrop" >

            <motion.div className="backDrop_contnet"
            
                initial={{ scale: 0.5,}}
                whileInView={{ scale: 1, }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
            
            >

                <div className="backDrop_contnet_top" >

                    <h5>Filters</h5>

                    <AiOutlineClose className='backDrop_contnet_top_ic' onClick={ closeModal } />

                </div>

                <div className='backDrop_contnet_div' >

                    <h5 className='backDrop_contnet_div_title' >Assets to buy</h5>

                    <div className='backDrop_contnet_div_m' >
                        <h4>Select an asset</h4>
                        <BiChevronDown className='backDrop_contnet_div_m_ic' />
                    </div>

                </div>

                <div className='backDrop_contnet_div' >

                    <h5 className='backDrop_contnet_div_title' >Assets to sell</h5>

                    <div className='backDrop_contnet_div_m' >
                        <h4>Select an asset</h4>
                        <BiChevronDown className='backDrop_contnet_div_m_ic' />
                    </div>

                </div>   

                <div className='backDrop_contnet_div' >

                    <h5 className='backDrop_contnet_div_title' >Time interval</h5>

                    <div className='backDrop_contnet_div_m' >
                        <h4>All time</h4>
                        <BiChevronDown className='backDrop_contnet_div_m_ic' />
                    </div>

                </div> 

                <button className='backDrop_contnet_submit' >
                    <IoMdCheckmark className='backDrop_contnet_submit_ic' color='white' />
                    <h5>Save</h5>
                </button>   

                <div className='backDrop_contnet_filter' >

                    <button className='backDrop_contnet_filter_center' >
                        <BsFunnel/>
                        <h5>Reset filters</h5>
                    </button>
                    
                </div>                         

            </motion.div>

        </div>
    );

}

const SelectTokenBdrop = ({closeModal}) => {

    const [ Alltokens, setAlltokens ] = useState([])
    const [ Loading, setLoading ] = useState(false)
    const [ Query, setQuery ] = useState('')
    const [ selectedToken, setselectedToken ] = useState(null)
    const [ Option, setOption ] = useState(false)
    

    const { RpcUrl } = useContext(AppContext)

    const GetTokenbyAddress = async () => {

        setLoading(true)

        try{

            const provider = new ethers.providers.JsonRpcProvider(RpcUrl)
            const erc20 = new ethers.Contract(Query,ERC20ABI,provider)

            const symbol = await erc20.symbol()
            const name = await erc20.name()
            const tokenAddress = Query

            
            
            setselectedToken([{
                symbol:symbol,
                name:name,
                tokenAddress:tokenAddress,
                tokenId: Option ? '' : null
            }])

            setLoading(false)


        }
        catch(error){
            setLoading(false)
            // console.log(error)
        }

    }

    return (

        <div className="backDrop" >

            <motion.div className='backDrop_getToken'
                initial={{ scale: 0.5,}}
                whileInView={{ scale: 1, }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
            >

                <div className="backDrop_getToken_close" style={{
                    display:"flex",
                    justifyContent:"space-between",
                    marginBottom:"1rem",
                    alignItems:"center"
                }} >

                    <h1 style={{
                        color:"white"
                    }} >Select Token</h1>

                    <AiOutlineClose color='white' style={{
                        cursor:"pointer"
                    }} onClick={ () => closeModal(selectedToken) } />
                </div>

                <div style={{
                    // border:"2px solid lightgray",
                    borderRadius:"10px",
                    marginBottom:"1.5rem",
                    padding:'.3rem',
                    display:"flex",
                    justifyContent:"space-between"
                }} >

                    <div style={{
                        padding:'.4rem',
                        backgroundColor: !Option ? "#161B2B" : 'transparent' ,
                        color:!Option ? "white" : 'gray',
                        width:"47%",
                        borderRadius:"10px",
                        textAlign:"center",
                        cursor:"pointer",
                        transition:"all .5s"
                    }} onClick={ () => {
                        setselectedToken(null)
                        setOption(false)
                    } } >Token</div>

                    <div style={{
                        padding:'.4rem',
                        backgroundColor: Option ? "#161B2B" : 'transparent' ,
                        color:Option ? "white" : 'gray',
                        width:"47%",
                        borderRadius:"10px",
                        textAlign:"center",
                        cursor:"pointer",
                        transition:"all .5s"
                    }} onClick={ () => {
                        setselectedToken(null)
                        setOption(true)
                    } } >veToken</div>

                </div>

                <div className='backDrop_getToken_top' >
                    <BiSearch className='backDrop_getToken_top_ic' />
                    <input type='text' placeholder='Search name or paste address' value={Query} on onChange={ (e) => {
                        setQuery(e.target.value)
                        setselectedToken(null)
                        GetTokenbyAddress()

                    } }  />
                </div>

                <div className='backDrop_getToken_selections' style={{
                    maxHeight:"50vh",
                    overflowY:"auto",
                }} >

                    { selectedToken ?
                    
                    
                        selectedToken.map( (token,index) => {

                            if ( (!token.address_label || !token.logo) && Query.length < 10  ) {
                                return <></>
                            }

                            return (
                                <div className='backDrop_getToken_selections_li' key={index} onClick={ () => {
                                    setselectedToken(token)
                                    closeModal(token)
                                } } >

                                    {/* <img src={ token.logo ? token.logo : ETHimg } alt='' /> */}

                                    <div className='backDrop_getToken_selections_li_right' >
                                        <h5>{token.name}</h5>
                                        <h6>{token.symbol}</h6>
                                    </div>

                                </div>
                            );
                        } )

                    
                    : Loading ? 
                    
                        <div style={{
                            width:"100%",
                            display:"flex",
                            justifyContent:"center",
                            alignItems:"center",
                        }} >  
                            <Spinner size='md' color='default' style={{
                                margin:'1rem auto'
                            }} />
                        </div>
                    
                    : <></> }

                </div>

                <button onClick={ () => GetTokenbyAddress() } style={{
                    width:"100%",
                    background:"linear-gradient(70deg, #7900D9 16.65%, #0097FF 78.93%)",
                    padding:'.4rem',
                    borderRadius:"6px",
                    color:"white",
                    marginTop:20,
                    fontWeight:"600"
                }} >Search</button>

            </motion.div>

        </div>

    );

}

const ErrorModal = ({closeModal}) => {

    return (

        <div className="backDrop" onClick={closeModal} >

            <motion.div className='backDrop_getToken'
                        
                initial={{ scale: 0.5,}}
                whileInView={{ scale: 1, }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
            
            >

                <img className='errorImg' alt='' src={CloseImg} />

                <h3 className='errorImg_top' >There has been an error</h3>

                <h2 className='errorImg_btm' >
                Transaction failed due to low gas limit. Please top up your wallet
                </h2>

            </motion.div>

        </div>

    );

}

const ErrorModal2 = ({closeModal,msg,presale}) => {

    return (

        <div className="backDrop" style={{
            width: presale ? "100%" : ''
        }} onClick={closeModal} >

            <motion.div className='backDrop_getToken'
                        
                initial={{ scale: 0.5,}}
                whileInView={{ scale: 1, }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
            
            >

                <img className='errorImg' alt='' src={CloseImg} />

                <h3 className='errorImg_top' >There has been an error</h3>

                <h2 className='errorImg_btm' >
                {msg}
                </h2>

            </motion.div>

        </div>

    );

}

const ComingSoonModal = ({closeModal}) => {

    return (

        <div className="backDrop" onClick={closeModal} style={{
            width:"100%"
        }} >

            <motion.div className='backDrop_getToken' style={{
                border:"2px solid white"
            }}
                        
                initial={{ scale: 0.5,}}
                whileInView={{ scale: 1, }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
                
            
            >

                <img className='errorImg' alt='' src={ComingSoonImg} />

                <h3 className='errorImg_top' style={{
                    fontWeight:"800",
                    fontFamily:"Raleway', sans-serif",
                    fontSize:'1.4rem'
                }} >Coming Soon</h3>

                <h2 className='errorImg_btm' >
                    We're thrilled to announce that something exciting is on the horizon! 
                    At Relay, we're diligently working behind the scenes to bring you a brand-new and 
                    innovative experience. Stay tuned for our upcoming launch. Thank you for your continued support!
                </h2>

            </motion.div>

        </div>

    );

}

const SuccessModal = ({closeModal}) => {


    return (

        <div className="backDrop" >

            <motion.div className='backDrop_getToken'
                        
                initial={{ scale: 0.5,}}
                whileInView={{ scale: 1, }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
            
            >

                <div className="backDrop_getToken_close" style={{
                    display:"flex",
                    justifyContent:"flex-end",
                    marginBottom:"1rem",
                    alignItems:"center"
                }} >
                    <AiOutlineClose color='white' style={{
                        cursor:"pointer"
                    }} onClick={ closeModal } />
                </div>


                <img className='errorImg' alt='' src={CeleberationImg} />

                <h3 className='errorImg_top' >Trade Compelete</h3>

                <h2 className='errorImg_btm' >
                    You have successfully completed the trade.  
                </h2>
{/* 
                <div style={{
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center"
                }} >
                    <h5 style={{
                        color:"white"
                    }} >http://localhost:3000/trade/{tradeId}</h5>
                    <CopyToClipboard text={`http://localhost:3000/trade/${tradeId}`} onCopy={ () => alert("Link Copied") } >
                        <BiSolidCopy style={{
                            color:"white",
                            marginLeft:"1.1rem",
                            cursor:"pointer"
                        }} />
                    </CopyToClipboard>
                </div> */}

            </motion.div>

        </div>

    );

}


const EditableSuccessModal = ({closeModal,modal_title,modal_message, presale}) => {


    return (

        <div className="backDrop" style={{
            width: presale ? "100%" : ''
        }} >

            <motion.div className='backDrop_getToken'
                        
                initial={{ scale: 0.5,}}
                whileInView={{ scale: 1, }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
            
            >

                <div className="backDrop_getToken_close" style={{
                    display:"flex",
                    justifyContent:"flex-end",
                    marginBottom:"1rem",
                    alignItems:"center"
                }} >
                    <AiOutlineClose color='white' style={{
                        cursor:"pointer"
                    }} onClick={ closeModal } />
                </div>


                <img className='errorImg' alt='' src={CeleberationImg} />

                <h3 className='errorImg_top' >{modal_title}</h3>

                <h2 className='errorImg_btm' >
                    {modal_message}  
                </h2>
            </motion.div>

        </div>

    );

}

const NormalBackdrop = ({closeModal}) => {
 
    return (
        <motion.div className="backDrop"
            // initial={{ scale: 0.5,}}
            // whileInView={{ scale: 1, }}
            // transition={{ duration: 0.4 }}
            // viewport={{ once: true }}
            onClick={closeModal}
        >
                

        </motion.div>
    );
    
}



const SliderModal = ({ display, closeModal}) => {

    return (
        <div className='sliderMain' style={{
            right: display ? '0rem' : '-20rem',
            display:"flex",
            alignItems:"center",
            cursor:"pointer"
        }} onClick={closeModal} >
            <div className='sliderMain_center' >
                Trade setup successful  🎉
            </div>
        </div>
    );

}

const ErrorSlideModal = ({error_msg, display, closeModal}) => {

    return (
        <div className='sliderError' style={{
            right: display ? '0rem' : '-20rem',
            display:"flex",
            alignItems:"center"
        }} onClick={ closeModal } >
            {error_msg} <AiFillWarning style={{
                marginLeft:'1rem'
            }} />
        </div>
    );

}


export { BackDrop, SelectTokenBdrop, ErrorModal, NormalBackdrop, SliderModal, ErrorSlideModal, SuccessModal, ComingSoonModal, ErrorModal2, EditableSuccessModal };