import UnderlineImg from '../assets/images/underline.png';
import { PiWarningOctagonFill } from 'react-icons/pi';

const ClaimTokenComponent = () => {
  return (
    <div className='presale_publicsale_div'>
      <div className="presale_publicsale_div_header">
        <h5>
          Claim your tokens
          <img src={UnderlineImg} alt="underline" />
        </h5>
      </div>

      <div className='presale_publicsale_div_body'>
        <div className='presale_publicsale_div_caution'>
          <PiWarningOctagonFill className='presale_publicsale_div_caution_ic' />
          <h6>Claim workflow is temporarily disabled during Solana migration</h6>
        </div>

        <div className='presale_publicsale_div_claim'>
          <div className='presale_publicsale_div_claim_div'>
            <h5>Amount of tokens claimed:</h5>
            <h6>0</h6>
          </div>

          <div className='presale_publicsale_div_claim_div'>
            <h5>Amount of tokens yet to be claimed:</h5>
            <h6>0</h6>
          </div>
        </div>

        <button disabled className='presale_publicsale_div_btnBm'>
          Claim Tokens
        </button>
      </div>
    </div>
  );
};

export default ClaimTokenComponent;
