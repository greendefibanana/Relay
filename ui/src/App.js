import { Route, Routes } from 'react-router-dom';
import './sass/main.scss';
import LandingPage from './pages/landingPage';
import DappIndex from './dapp/dapp.index';
import SetuptradeDapp from './dapp/dapp.setuptrade';
import OtcDapp from './dapp/dapp.otc';
import StakingPage from './dapp/dapp.stakings';
import { useEffect, useState } from 'react';
import AppContext from './context/Appcontext';
import Logo from './assets/images/logo.png';
import { Spinner } from '@nextui-org/react';
import { ComingSoonModal } from './components/uiOverlay';
import PresalePage from './pages/presalePage';
import TradeOtc from './dapp/Trade.otc';

function App() {
  const [openSideNav, setopenSideNav] = useState(false);
  const [openComingSoon, setOpenComingSoon] = useState(false);
  const [preLoader, setpreLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setpreLoader(false);
    }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
      <div className='mainApp'>
        {openComingSoon ? <ComingSoonModal closeModal={() => setOpenComingSoon(false)} /> : <></>}

        <AppContext.Provider
          value={{
            sideNav: openSideNav,
            UpdatesideNav: () => setopenSideNav(!openSideNav),
            enableWeb3: () => setOpenComingSoon(true),
            closeWeb3: () => {},
            isWeb3Enabled: false,
            user_account: null,
            displayAccount: null,
            signer: null,
            walletProvider: null,
            TradeFactorycontractAddress: '',
            MainControllercontractAddress: '',
            RpcUrl: '',
            PresaleSmartContractAddress: '',
            comingsoon:() => setOpenComingSoon(true)
          }}
        >

        {preLoader ?
        
        <div style={{
          width:'100%',
          height:"100vh",
          display:"flex",
          justifyContent:"center",
          alignItems:"center",
          flexDirection:"column",
          backgroundColor:"#0D1019"
        }} >

            <img src={Logo} alt='' style={{
              width:"4rem",
              display:"block",
            }} />

            <Spinner size='lg' color='default' style={{
              marginTop:"2rem"
            }} />

        </div>
      
      :
        <Routes>
          <Route path='/' element={ <LandingPage/> } />

          <Route path='/presale' element={ <PresalePage/> } />

          <Route path='/staking' element={ <DappIndex
            component={<StakingPage closeHeader={() => setopenSideNav(!openSideNav)} />}
          /> } />

          <Route path='/trades' element={ <DappIndex
            component={<OtcDapp closeHeader={() => setopenSideNav(!openSideNav)} />}
          /> } />

          <Route path='/trade_detail/:tradeId' element={ <DappIndex
            component={<TradeOtc closeHeader={() => setopenSideNav(!openSideNav)} />}
          /> } />

          <Route path='/setuptrade' element={<DappIndex
            component={<SetuptradeDapp closeHeader={() => setopenSideNav(!openSideNav)} />}
          />} />


      </Routes>


      
      }

        </AppContext.Provider>
      </div>
  );
}

export default App;
