import React from "react";

const AppContext = React.createContext({
  sideNav: false,
  UpdatesideNav: () => {},
  enableWeb3: () => {},
  closeWeb3: () => {},
  isWeb3Enabled: false,
  user_account: false,
  displayAccount: false,
  signer: false,
  walletProvider:false,
  TradeFactorycontractAddress:false,
  MainControllercontractAddress:false,
  PresaleSmartContractAddress:false,
  RpcUrl: false,
  comingsoon:false
});

export default AppContext;
