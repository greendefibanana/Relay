import { Route, Routes } from 'react-router-dom';
import './sass/main.scss';
import LandingPage from './pages/landingPage';
import DappIndex from './dapp/dapp.index';
import SetuptradeDapp from './dapp/dapp.setuptrade';
import OtcDapp from './dapp/dapp.otc';
import StakingPage from './dapp/dapp.stakings';
import DashboardDapp from './dapp/dapp.dashboard';
import NotFoundDapp from './dapp/dapp.404';
import { useState, useEffect } from 'react';
import AppContext from './context/Appcontext';
import TradeOtc from './dapp/Trade.otc';
import Logo from './assets/images/logo.png';
import { Spinner } from '@nextui-org/react';
import PresalePage from './pages/presalePage';
import { usePhantomWallet } from './hooks/useWallet';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [openSideNav, setopenSideNav] = useState(false);
  const [preLoader, setpreLoader] = useState(true);

  const {
    publicKey,
    connected,
    connecting,
    displayKey,
    connect,
    disconnect,
    signTransaction,
    signMessage,
  } = usePhantomWallet();

  // Format address for display (already short from hook, but keep compat)
  const userWalletAddress = displayKey;

  useEffect(() => {
    setTimeout(() => setpreLoader(false), 1500);
  }, []);

  const clearCacheData = () => {
    disconnect();
    localStorage.clear();
  };

  return (
    <div className='mainApp'>
      <AppContext.Provider
        value={{
          sideNav: openSideNav,
          UpdatesideNav: () => setopenSideNav(!openSideNav),
          enableWeb3: connect,
          closeWeb3: clearCacheData,
          isWeb3Enabled: connected,
          user_account: publicKey,
          displayAccount: userWalletAddress,
          connecting,
          comingsoon: connect,
          signTransaction,
          signMessage,
        }}
      >
        {preLoader ? (
          <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            backgroundColor: '#0D1019',
          }}>
            <img src={Logo} alt='' style={{ width: '4rem', display: 'block' }} />
            <Spinner size='lg' color='default' style={{ marginTop: '2rem' }} />
          </div>
        ) : (
          <ErrorBoundary>
            <Routes>
              <Route path='/' element={<LandingPage />} />
              <Route path='/presale' element={<PresalePage />} />
              <Route path='/dashboard' element={<DappIndex component={<DashboardDapp closeHeader={() => setopenSideNav(!openSideNav)} />} />} />
              <Route path='/staking' element={<DappIndex component={<StakingPage closeHeader={() => setopenSideNav(!openSideNav)} />} />} />
              <Route path='/trades' element={<DappIndex component={<OtcDapp closeHeader={() => setopenSideNav(!openSideNav)} />} />} />
              <Route path='/trade_detail/:tradeId' element={<DappIndex component={<TradeOtc closeHeader={() => setopenSideNav(!openSideNav)} />} />} />
              <Route path='/setuptrade' element={<DappIndex component={<SetuptradeDapp closeHeader={() => setopenSideNav(!openSideNav)} />} />} />
              <Route path='*' element={<DappIndex component={<NotFoundDapp closeHeader={() => setopenSideNav(!openSideNav)} />} />} />
            </Routes>
          </ErrorBoundary>
        )}
      </AppContext.Provider>
    </div>
  );
}

export default App;
