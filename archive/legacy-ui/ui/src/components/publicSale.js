import UnderlineImg from '../assets/images/underline.png';
import { PiWarningOctagonFill } from 'react-icons/pi';
import { useState } from 'react';

const PublicSaleComponent = () => {
  const [amountToContribute, setamountToContribute] = useState('');

  return (
    <div className='presale_publicsale_div'>
      <div className="presale_publicsale_div_header">
        <h5>
          Public Sale
          <img src={UnderlineImg} alt="underline" />
        </h5>
      </div>

      <div className='presale_publicsale_div_body'>
        <h4 className='presale_publicsale_div_ised'>Funds raised:</h4>

        <div className='presale_publicsale_div_progress'>
          <div className='presale_publicsale_div_progress_bar'></div>
        </div>

        <div className='presale_publicsale_div_caution'>
          <PiWarningOctagonFill className='presale_publicsale_div_caution_ic' />
          <h6>Wallet actions are disabled in UI preview mode</h6>
        </div>

        <h4 className='presale_publicsale_div_contribute'>
          Solana Presale Flow Preview
        </h4>

        <h4 className='presale_publicsale_div_ipsum'>
          Layout and content are active. Contract approvals and contributions were removed from this frontend preview.
        </h4>

        <input
          type='text'
          placeholder='Enter amount'
          className='presale_publicsale_div_textBox'
          value={amountToContribute}
          onChange={(e) => setamountToContribute(e.target.value)}
        />

        <div className='presale_publicsale_div_fin'>
          <button disabled>Approve</button>
          <button disabled>Contribute</button>
        </div>
      </div>
    </div>
  );
};

export default PublicSaleComponent;
