import EthImg from '../assets/images/eth.png';
import {FaExchangeAlt} from 'react-icons/fa';
import {FiExternalLink} from 'react-icons/fi';
import {BiSolidCopy} from 'react-icons/bi';
import RelayIc from '../assets/images/relay_ic.png';
import { useEffect } from 'react';
import { useState } from 'react';
import { commonToken } from '../constants/tokens';
import {  motion } from 'framer-motion';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useContext } from 'react';
import AppContext from '../context/Appcontext';
import { ethers } from 'ethers';
import { ERC20ABI } from '../constants/abi';
import { Spinner } from '@nextui-org/react';


const TradeComponent = ({ receivingToken, givingToken, trade, withdrawalFunction, cancelFunction, loading, acceptFunction  }) => {

    const [ recieveTok, setrecieveTok ] = useState()
    const [ givingTok, setgivingTok ] = useState()
    const { RpcUrl } = useContext(AppContext)


    const getTokenDetails = async (token,number) => {

        try{

            const provider = new ethers.providers.JsonRpcProvider(RpcUrl)
            const erc20 = new ethers.Contract(token.tokenAddress,ERC20ABI,provider)

            const symbol = await erc20.symbol()
            const name = await erc20.name()
            const tokenAddress = token.tokenAddress


            const hexToDecimal = hex => parseInt(hex, 16)
            let value = hexToDecimal(token.value._hex);

            let isToken;

            if ( value < 1000000 ) {
                isToken = true
            }else{
                isToken = false
                value = value / 1000000
            }


            let tokendet = {
                name:name,
                symbol:symbol,
                tokenAddress:tokenAddress,
                value: value,
                isToken:isToken
            }

            if ( number === 1 ) {
                setrecieveTok(tokendet)
            }else{
                setgivingTok(tokendet)
            }


        }
        catch(error){
            // console.log(error)
        }

    }

    useEffect( () => {

        getTokenDetails(receivingToken,1)
        getTokenDetails(givingToken,2)

    } , [receivingToken,givingToken] )

    return (

        <motion.div className='trade_div'
                initial={{ scale: 0.5,}}
                whileInView={{ scale: 1, }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
        >

                    <div className='trade_div_top' >
                        <h5 className='trade_div_top_left' >{ recieveTok ? recieveTok.symbol : '' } / { givingTok ? givingTok.symbol : '' }</h5>
                        <div className='trade_div_top_right'  >
                            <h6 className='trade_div_top_right_txt' >Copy Trade URL</h6>
                            <CopyToClipboard text={`https://www.relaydapp.xyz/trade_detail/${trade.tradeId}`} onCopy={ () => alert("Link Copied") } >
                                <BiSolidCopy className='trade_div_top_right_ic' style={{
                                    cursor:"pointer"
                                }} />
                            </CopyToClipboard>
                        </div>
                    </div>

                    <div className='trade_div_GW' >
                        <h6 className='trade_div_GW_txt' >
                            <span>Gives:</span>
                            { recieveTok ? recieveTok.isToken ? `Nft ${recieveTok.value}` : recieveTok.value : '' }
                        </h6>
                        <h6 className='trade_div_GW_txt' >
                            <span>Wants:</span>
                            { givingTok ? givingTok.isToken ? `Nft ${givingTok.value}` : givingTok.value : '' }
                        </h6>
                    </div>

                    <div className='trade_div_mid' >

                        <h5>(${ recieveTok ? recieveTok.isToken ? '' : Math.round(recieveTok.value * 1) : '' })</h5>

                        <FaExchangeAlt className='trade_div_mid_ic' />

                        <h5>(${ givingTok ? givingTok.isToken ? '' : Math.round(givingTok.value * 1) : '' })</h5>

                    </div>

                    <div className='trade_div_lst' >

                        <div className='trade_div_lst_pt' >

                            {/* <img src={ recieveTok ? recieveTok.tokenLogo : RelayIc } style={{
                                width:'1.3rem'
                            }} alt='' /> */}

                            <h5>{recieveTok ? recieveTok.name : ''}</h5>

                            {/* <FiExternalLink className='trade_div_lst_pt_ic' /> */}

                        </div>

                        <div className='trade_div_lst_pt' >

                            {/* <FiExternalLink className='trade_div_lst_pt_ic' /> */}

                            {/* <img src={ givingTok ? givingTok.tokenLogo : RelayIc } alt='' style={{
                                width:'1.3rem'
                            }} /> */}

                            <h5>{ givingTok ? givingTok.name : '' }</h5>

                        </div>

                    </div>

                    { receivingToken.isSwapped && givingToken.isExecuted && receivingToken.isExecuted ?
                                        
                        receivingToken.isSwapped && givingToken.isExecuted && receivingToken.isExecuted && givingToken.isExecuted ?
                        
                        <button className='trade_div_btn' disabled={loading} onClick={withdrawalFunction} >
                            { loading ? <Spinner size='sm' color='default' /> : 'Withdraw Token'}
                        </button> 

                        :

                        <button className='trade_div_btn' disabled={loading} onClick={withdrawalFunction} >
                            { loading ? <Spinner size='sm' color='default' /> : 'Withdraw Token'}
                        </button> 
                    :

                        !receivingToken.isExecuted ? 

                            <button className='trade_div_btn' disabled={loading} onClick={acceptFunction} >
                                { loading ? <Spinner size='sm' color='default' /> : 'Accept Trade'}
                            </button>
                        
                        :


                        <button className='trade_div_btn' disabled={loading} onClick={cancelFunction} >
                            { loading ? <Spinner size='sm' color='default' /> : 'Cancel Trade' }
                        </button>

                    }

                </motion.div>

    );

}



const TradeDetail = ({ receivingToken, givingToken, trade, withdrawalFunction, cancelFunction, acceptFunction, loading  }) => {

    const [ recieveTok, setrecieveTok ] = useState()
    const [ givingTok, setgivingTok ] = useState()
    const { RpcUrl } = useContext(AppContext)


    const getTokenDetails = async (token,number) => {

        try{

            const provider = new ethers.providers.JsonRpcProvider(RpcUrl)
            const erc20 = new ethers.Contract(token.tokenAddress,ERC20ABI,provider)

            const symbol = await erc20.symbol()
            const name = await erc20.name()
            const tokenAddress = token.tokenAddress


            const hexToDecimal = hex => parseInt(hex, 16)
            let value = hexToDecimal(token.value._hex);

            let isToken;

            // console.log(value)

            if ( value < 1000000 ) {
                isToken = true
            }else{
                isToken = false
                value = value / 1000000
            }

            // value = value / 1000000

            let tokendet = {
                name:name,
                symbol:symbol,
                tokenAddress:tokenAddress,
                value: value,
                isToken:isToken
            }

            if ( number === 1 ) {
                setrecieveTok(tokendet)
            }else{
                setgivingTok(tokendet)
            }


        }
        catch(error){
            // console.log(error)
        }

    }

    useEffect( () => {

        getTokenDetails(receivingToken,1)
        getTokenDetails(givingToken,2)

    } , [receivingToken,givingToken] )

    return (

        <motion.div className='trade_div'
                initial={{ scale: 0.5,}}
                whileInView={{ scale: 1, }}
                transition={{ duration: 0.4 }}
                viewport={{ once: true }}
        >

                    <div className='trade_div_top' >
                        <h5 className='trade_div_top_left' >{ recieveTok ? recieveTok.symbol : '' } / { givingTok ? givingTok.symbol : '' }</h5>
                        <div className='trade_div_top_right'  >
                            <h6 className='trade_div_top_right_txt' >Copy Trade URL</h6>
                            <CopyToClipboard text={`https://www.relaydapp.xyz/trade_detail/${trade.tradeId}`} onCopy={ () => alert("Link Copied") } >
                                <BiSolidCopy className='trade_div_top_right_ic' style={{
                                    cursor:"pointer"
                                }} />
                            </CopyToClipboard>
                        </div>
                    </div>

                    <div className='trade_div_GW' >
                        <h6 className='trade_div_GW_txt' >
                            <span>Gives:</span>
                            { recieveTok ? recieveTok.isToken ? `Nft ${recieveTok.value}` : recieveTok.value : '' }
                        </h6>
                        <h6 className='trade_div_GW_txt' >
                            <span>Receive:</span>
                            { givingTok ? givingTok.isToken ? `Nft ${givingTok.value} ` : givingTok.value : '' }
                        </h6>
                    </div>

                    <div className='trade_div_mid' >

                        <h5>(${ recieveTok ? recieveTok.isToken ? '' : Math.round(recieveTok.value * 1) : '' })</h5>

                        <FaExchangeAlt className='trade_div_mid_ic' />

                        <h5>(${ givingTok ? givingTok.isToken ? '' : Math.round(givingTok.value * 1) : '' })</h5>

                    </div>

                    <div className='trade_div_lst' >

                        <div className='trade_div_lst_pt' >
{/* 
                            <img src={ recieveTok ? recieveTok.tokenLogo : RelayIc } style={{
                                width:'1.3rem'
                            }} alt='' /> */}

                            <h5>{recieveTok ? recieveTok.name : ''}</h5>

                            {/* <FiExternalLink className='trade_div_lst_pt_ic' /> */}

                        </div>

                        <div className='trade_div_lst_pt' >

                            {/* <FiExternalLink className='trade_div_lst_pt_ic' /> */}
{/* 
                            <img src={ givingTok ? givingTok.tokenLogo : RelayIc } alt='' style={{
                                width:'1.3rem'
                            }} /> */}

                            <h5>{ givingTok ? givingTok.name : '' }</h5>

                        </div>

                    </div>

                    { receivingToken.isSwapped && givingToken.isExecuted && receivingToken.isExecuted ?
                    
                        receivingToken.isSwapped && givingToken.isExecuted && receivingToken.isExecuted && givingToken.isExecuted ?
                        
                        <button className='trade_div_btn' disabled={loading} onClick={withdrawalFunction} >
                            { loading ? <Spinner size='sm' color='default' /> : 'Withdraw Token'}
                        </button> 

                        :
                    
                        <button className='trade_div_btn' disabled={loading} onClick={withdrawalFunction} >
                            { loading ? <Spinner size='sm' color='default' /> : 'Withdraw Token'}
                        </button> 
                    :

                        !receivingToken.isExecuted ? 

                            <button className='trade_div_btn' disabled={loading} onClick={acceptFunction} >
                                { loading ? <Spinner size='sm' color='default' /> : 'Accept Trade'}
                            </button>
                        
                        :


                        <button className='trade_div_btn' disabled={loading} onClick={cancelFunction} >
                            { loading ? <Spinner size='sm' color='default' /> : 'Cancel Trade' }
                        </button>
                    
                    }

                </motion.div>

    );

}


export {TradeDetail,TradeComponent};