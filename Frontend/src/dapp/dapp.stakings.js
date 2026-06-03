import { BsClock } from 'react-icons/bs';
import { useContext } from 'react';
import AppContext from '../context/Appcontext';
import DappHeader from '../components/DappHeader';

const StakingPage = ({ closeHeader }) => {
  const { enableWeb3, displayAccount, user_account } = useContext(AppContext);
  const isConnected = !!user_account;

  const handleGated = (e) => {
    if (!isConnected) {
      e.preventDefault();
      enableWeb3();
    }
  };

  return (
    <div className="Otc_main">
      <DappHeader
        title="STAKING"
        closeHeader={closeHeader}
        displayAccount={displayAccount}
        enableWeb3={enableWeb3}
      />

      <div className="Otc_main_body">
        {/* ── Coming Soon Banner ── */}
        <div className="staking_coming_soon_banner">
          <BsClock size={18} />
          <div>
            <strong>Staking coming soon</strong>
            <p>$RLY staking rewards are scheduled for launch in Q3 2026 once protocol governance is live.</p>
          </div>
        </div>

        {/* ── Token Holding ── */}
        <div className="stake_t_holding">
          <h6 className="stake_t_holding_title">Token Holding</h6>
          <div className="stake_t_holding_wal">
            <h5 className="stake_t_holding_wal_wallet">Wallet:</h5>
            <h6 className="stake_t_holding_wal_value">
              {displayAccount
                ? <span style={{ color: "#14F195" }}>{displayAccount}</span>
                : <span style={{ color: "#555", fontFamily: "var(--raleway)" }}>Not connected</span>
              }
            </h6>
          </div>
        </div>

        {/* ── Stake $RLY ── */}
        <div className="stake_t_holding">
          <h6 className="stake_t_holding_title">Stake $RLY</h6>
          <div className="stake_t_holding_split">
            <div className="stake_t_holding_split_left">
              <h5 className="stake_t_holding_split_left_wallet">0.00</h5>
              <h6 className="stake_t_holding_split_left_value">MAX</h6>
            </div>
            <div className="stake_t_holding_split_right">
              <button disabled={!isConnected} onClick={handleGated} style={{ opacity: isConnected ? 1 : 0.45, cursor: isConnected ? "pointer" : "not-allowed" }}>
                Approve
              </button>
              <button disabled={!isConnected} onClick={handleGated} style={{ opacity: isConnected ? 1 : 0.45, cursor: isConnected ? "pointer" : "not-allowed" }}>
                Stake
              </button>
            </div>
          </div>
        </div>

        {/* ── Claim Rewards ── */}
        <div className="stake_t_holding">
          <h6 className="stake_t_holding_title">Claim Rewards</h6>
          <h6 className="stake_t_holding_subTitle">Holders Reward</h6>

          <div className="stake_t_holding_split">
            <div className="stake_t_holding_split_left">
              <h5 className="stake_t_holding_split_left_wallet">Accumulated Rewards:</h5>
              <h6 className="stake_t_holding_split_left_value">—</h6>
            </div>
            <div className="stake_t_holding_split_right">
              <button disabled={!isConnected} onClick={handleGated} style={{ opacity: isConnected ? 1 : 0.45, cursor: isConnected ? "pointer" : "not-allowed" }}>
                Approve
              </button>
              <button disabled={!isConnected} onClick={handleGated} style={{ opacity: isConnected ? 1 : 0.45, cursor: isConnected ? "pointer" : "not-allowed" }}>
                Claim
              </button>
            </div>
          </div>

          <h6 className="stake_t_holding_title" style={{ marginTop: "2rem" }}>Reward History</h6>
          <h6 className="stake_t_holding_subTitle">Holders Reward History</h6>

          <div className="covering">
            <div className="stake_t_holding_tableTop">
              <div className="stake_t_holding_tableTop_div">Time</div>
              <div className="stake_t_holding_tableTop_div">Rewards From Protocol</div>
              <div className="stake_t_holding_tableTop_div">Rewards From Token Tax</div>
            </div>

            {!isConnected ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.35)", fontFamily: "var(--raleway)", fontSize: "0.85rem" }}>
                Connect your wallet to view reward history.
              </div>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.35)", fontFamily: "var(--raleway)", fontSize: "0.85rem" }}>
                No rewards received yet. Staking launches Q3 2026.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakingPage;
