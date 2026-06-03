import { Link } from 'react-router-dom';
import { BsShieldLock, BsArrowRight } from 'react-icons/bs';

const ClaimTokenComponent = () => {
  return (
    <section className='presale_status_card presale_status_card--quiet' aria-labelledby='claim-status-title'>
      <div className='presale_status_card_badge presale_status_card_badge--quiet'>
        <BsShieldLock aria-hidden='true' />
        Claims disabled
      </div>

      <div className='presale_status_card_body'>
        <h2 id='claim-status-title'>No token claim is available</h2>
        <p>
          Relay does not expose token-claim transactions in this grant-backed Solana build.
          Wallet activity should happen through verified listing, clearance, and match flows in the dapp.
        </p>
      </div>

      <div className='presale_status_card_actions'>
        <Link to='/dashboard' className='presale_status_card_primary'>
          View dashboard
          <BsArrowRight aria-hidden='true' />
        </Link>
      </div>
    </section>
  );
};

export default ClaimTokenComponent;
