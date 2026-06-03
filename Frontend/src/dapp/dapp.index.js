import { Link, NavLink } from 'react-router-dom';
import '../sass/main.scss';
import LogoImg from '../assets/images/logo.png';
import { AiOutlineCopyrightCircle } from 'react-icons/ai';
import {
  BsGrid1X2,
  BsArrowLeftRight,
  BsPlusCircle,
  BsCurrencyDollar,
  BsBoxArrowRight,
  BsBoxArrowInRight,
  BsWifi,
} from 'react-icons/bs';
import { useContext } from 'react';
import AppContext from '../context/Appcontext';
import { NormalBackdrop } from '../components/backDropComponent';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: BsGrid1X2,       label: 'Dashboard'            },
  { to: '/setuptrade', icon: BsPlusCircle,     label: 'List Agreement'       },
  { to: '/trades',     icon: BsArrowLeftRight, label: 'Secondary Market'     },
  { to: '/staking',    icon: BsCurrencyDollar, label: 'Staking'              },
];

const SideNavContent = ({ onLinkClick }) => {
  const { enableWeb3, displayAccount, closeWeb3 } = useContext(AppContext);

  return (
    <>
      <div>
        <Link className='dappIndex_left_logo' to='/trades' onClick={onLinkClick}>
          <img src={LogoImg} alt='logo' />
          <h5>Relay</h5>
        </Link>

        <div className='dappIndex_left_div'>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onLinkClick}
              className={({ isActive }) =>
                isActive ? 'dappIndex_left_div_link_active' : 'dappIndex_left_div_link'
              }
            >
              <Icon className='nav_icon' />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className='dappIndex_left_btm'>
        {/* Network status chip */}
        <div className='dappIndex_left_btm_network'>
          <BsWifi size={12} color='#14F195' />
          <span>Solana Devnet</span>
          <div className='solana_dot' style={{ margin: '0 0 0 auto' }} />
        </div>

        <div className='dappIndex_left_btm_wallet'>
          {displayAccount ? (
            <button
              type="button"
              className='dappIndex_left_btm_wallet_center'
              onClick={closeWeb3}
              title='Click to disconnect'
            >
              <BsBoxArrowRight size={13} style={{ flexShrink: 0 }} />
              {displayAccount}
            </button>
          ) : (
            <button
              type="button"
              className='dappIndex_left_btm_wallet_center'
              onClick={() => { if (onLinkClick) onLinkClick(); enableWeb3(); }}
            >
              <BsBoxArrowInRight size={13} style={{ flexShrink: 0 }} />
              Enter Dark Pool
            </button>
          )}
        </div>
      </div>
    </>
  );
};

function DappIndex({ component }) {
  const { sideNav, UpdatesideNav } = useContext(AppContext);

  return (
    <div className='dappIndex'>

      {/* ── Permanent sidebar (desktop) ── */}
      <div className='dappIndex_left'>
        <SideNavContent />
      </div>

      {/* ── Slide-in sidebar (mobile) ── */}
      {sideNav && (
        <motion.div
          className='dappIndex_left special_sidenav'
          initial={{ scaleX: 0, transformOrigin: '0% 0%', opacity: 1 }}
          whileInView={{ scaleX: 1, transformOrigin: '0% 0%', opacity: 1 }}
          transition={{ duration: 0.2 }}
          viewport={{ once: true }}
        >
          <SideNavContent onLinkClick={() => UpdatesideNav()} />
        </motion.div>
      )}

      {/* ── Main content ── */}
      <div className='dappIndex_right'>
        {component}
        <div className='dappIndex_right_btm1' />
        <div className='dappIndex_right_btm'>
          <AiOutlineCopyrightCircle color='#FDFDFE' />
          2026.RELAY
        </div>
      </div>

      {sideNav && <NormalBackdrop closeModal={() => UpdatesideNav()} />}
    </div>
  );
}

export default DappIndex;
