import React from "react";

const AppContext = React.createContext({
  sideNav: false,
  UpdatesideNav: () => {},
  enableWeb3: () => {},
  closeWeb3: () => {},
  isWeb3Enabled: false,
  user_account: false,
  displayAccount: false,
  comingsoon:false,
  signTransaction: null,
  signMessage: null,
});

export default AppContext;
