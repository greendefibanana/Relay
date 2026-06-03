import { Link } from "react-router-dom";
import { IoMdMenu } from "react-icons/io";

const DappHeader = ({ title, closeHeader, displayAccount, enableWeb3, showNetwork = true }) => (
  <div className="Otc_main_header">
    <h5>{title}</h5>

    <div className="Otc_main_header_spc">
      <button
        type="button"
        className="Otc_main_header_spc_menu"
        onClick={closeHeader}
        aria-label="Open navigation"
      >
        <IoMdMenu className="Otc_main_header_spc_ic" aria-hidden="true" />
      </button>
      <Link className="Otc_main_header_spc_txt" to="/trades">RELAY</Link>
    </div>

    <div className="Otc_main_header_right">
      {showNetwork && (
        <div className="Otc_main_header_right_live" aria-label="Current network: Solana Devnet">
          <div className="solana_dot" aria-hidden="true" />
          <h6>Solana Devnet</h6>
        </div>
      )}
      {enableWeb3 && (
        <div className="Otc_main_header_right_wallet otc_tophdvgt">
          {displayAccount ? (
            <div className="Otc_main_header_right_wallet_center Otc_main_header_right_wallet_center--connected">
              <span className="wallet_status_dot" aria-hidden="true" />
              <span>{displayAccount}</span>
            </div>
          ) : (
            <button
              type="button"
              className="Otc_main_header_right_wallet_center"
              onClick={enableWeb3}
            >
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

export default DappHeader;
