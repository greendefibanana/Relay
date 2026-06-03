import { Link } from 'react-router-dom';
import { PiWarningOctagonFill } from 'react-icons/pi';
import { BsArrowRight } from 'react-icons/bs';

const PublicSaleComponent = () => {
  return (
    <section className='presale_status_card' aria-labelledby='presale-status-title'>
      <div className='presale_status_card_badge'>
        <PiWarningOctagonFill aria-hidden='true' />
        Solana launch path
      </div>

      <div className='presale_status_card_body'>
        <h2 id='presale-status-title'>Relay is not running a public presale</h2>
        <p>
          Relay is launching on Solana and is being advanced through grant-backed development,
          not a public token sale. There is no live SOL contribution window in this build.
        </p>
      </div>

      <div className='presale_status_card_actions'>
        <Link to='/trades' className='presale_status_card_primary'>
          Open liquidity market
          <BsArrowRight aria-hidden='true' />
        </Link>
        <Link to='/setuptrade' className='presale_status_card_secondary'>
          Create private RFQ
        </Link>
      </div>
    </section>
  );
};

export default PublicSaleComponent;
