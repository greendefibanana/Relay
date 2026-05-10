import UnderlineImg from '../assets/images/underline.png';
import { PiWarningOctagonFill } from 'react-icons/pi'
import { useContext, useState } from 'react';
import AppContext from '../context/Appcontext';
import { Spinner } from '@nextui-org/react';
import { EditableSuccessModal, ErrorModal2 } from './backDropComponent';


const PublicSaleComponent = () => {

    const { user_account, enableWeb3 } = useContext(AppContext)
    const [ isLoading, setisLoading ] = useState(false)
    const [ iserror, setiserror ] = useState({
        status:false,
        title:"",
        message:""
    })
    const [ isSuccess, setisSuccess ] = useState({
        status:false,
        title:"",
        message:""
    })
    const [ amountToContribute, setamountToContribute ] = useState('')

    const approveHandler = async () => {

        setisLoading(true)

        try{

            if ( amountToContribute === '' ) {
                setisLoading(false)
                return
            }

            setisLoading(false)
            setiserror({
                status:true,
                title:"Public sale unavailable",
                message:"Token sale approvals are not enabled in this Relay build."
            })


        }
        catch(error){
            console.log(error)
            setisLoading(false)
            setiserror({
                status:true,
                title:"Something went wrong",
                message:"error message"
            })
        }

    }

    const contributeHandler = async () => {

        setisLoading(true)

        try{

            if ( amountToContribute === '' ) {
                setisLoading(false)
                return
            }

            setisLoading(false)
            setiserror({
                status:true,
                title:"Public sale unavailable",
                message:"Token sale contributions are not enabled in this Relay build."
            })
        }
        catch(error){
            console.log(error)
            setisLoading(false)
            setiserror({
                status:true,
                title:"Something went wrong",
                message:"error message"
            })
        }

    }

    return (

        <div className='presale_publicsale_div' >

            <div className="presale_publicsale_div_header" >

                <h5>Public Sale                
                    <img src={UnderlineImg} alt="underline" />

                </h5>

            </div>

            <div className='presale_publicsale_div_body' >
                
                <h4 className='presale_publicsale_div_ised' >Funds raised:</h4>

                <div className='presale_publicsale_div_progress' >
                    <div className='presale_publicsale_div_progress_bar' ></div>
                </div>

                <div className='presale_publicsale_div_caution' >
                    <PiWarningOctagonFill className='presale_publicsale_div_caution_ic' />
                    <h6>Make sure that you’re contibuting WETH</h6>
                </div>

                <h4 className='presale_publicsale_div_contribute' >
                    Contribute WETH (1 $Relay: 0.0000037 WETH)
                </h4>

                <h4 className='presale_publicsale_div_ipsum' >
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </h4>

                { user_account ?
                
                    <>
                    
                        <input type='text' placeholder='Enter the ammount in WETH' className='presale_publicsale_div_textBox' value={amountToContribute} onChange={ (e) => setamountToContribute(e.target.value) } />

                        <div className='presale_publicsale_div_fin' >
                            <button disabled={ isLoading } onClick={ () => approveHandler() } >{ isLoading ? <Spinner
                                color="default" size="sm"
                            /> : 'Approve WETH' }</button>
                            <button disabled={isLoading} onClick={ () => contributeHandler() } >{ isLoading ? <Spinner
                                color="default" size="sm"
                            /> : 'Contribute WETH' }</button>
                        </div>

                    </>
                
                : <button onClick={ () => enableWeb3() } className='presale_publicsale_div_btnBm' >
                    Connect Wallet
                </button> }

            </div>


            {/* <img src={EclipseImg} alt="ss" className='presale_publicsale_div_leftImg' />
            <img src={RightImg} alt="ss" className='presale_publicsale_div_rightImg' />
            <img src={RightEcliImg} alt="ss" className='presale_publicsale_div_miniRight' />
            <img src={LeftEcliImg} alt="ss" className='presale_publicsale_div_miniLeft' /> */}

            { isSuccess.status ? 
            
                <EditableSuccessModal
                    closeModal={ () => setisSuccess({
                        status:false,
                        title:"",
                        message:""
                    }) }
                    modal_message={ isSuccess.message }
                    modal_title={isSuccess.title}
                    presale={true}
                />
            
            : <></> }

            { iserror.status ?
            
            
                <ErrorModal2
                    closeModal={ () => setiserror({
                        status:false,
                        title:"",
                        message:""
                    }) }
                    msg={iserror.message}
                    presale={true}
                />

            : <></> }

        </div>

    );

}

export default PublicSaleComponent;
