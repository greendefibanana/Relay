import { Link } from "react-router-dom";
import {
  BsArrowLeftRight,
  BsShieldCheck,
  BsPlusCircle,
  BsBarChart,
  BsArrowRepeat,
} from "react-icons/bs";
import { FiExternalLink } from "react-icons/fi";
import { useContext, useEffect, useState, useCallback } from "react";
import AppContext from "../context/Appcontext";
import { Spinner } from "@nextui-org/react";
import { cancelListing, getClearanceStatus, getListings } from "../lib/rfq-client";
import ClearanceBadge from "../components/ClearanceBadge";
import PerBadge from "../components/PerBadge";
import { EditableSuccessModal } from "../components/backDropComponent";
import DappHeader from "../components/DappHeader";

const StatCard = ({ label, value, icon: Icon, accent }) => (
  <div className="dash_stat_card" style={{ "--accent": accent }}>
    <div className="dash_stat_card_icon">
      <Icon size={20} />
    </div>
    <div className="dash_stat_card_info">
      <span className="dash_stat_card_value">{value}</span>
      <span className="dash_stat_card_label">{label}</span>
    </div>
  </div>
);

const DashboardDapp = ({ closeHeader }) => {
  const { enableWeb3, displayAccount, user_account, signTransaction } = useContext(AppContext);

  const [listings, setListings] = useState(null);
  const [clearance, setClearance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getListings();
      setListings(data);
      if (user_account) {
        const cl = await getClearanceStatus(user_account);
        setClearance(cl);
      }
    } catch (err) {
      setLoadError(err.message || "Could not load dashboard data.");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [user_account]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (tradeId) => {
    setCancelling(tradeId);
    try {
      await cancelListing(tradeId, { seller: user_account }, signTransaction);
      setModal({ title: "Listing Cancelled", message: "Your listing has been removed from the secondary market. To change terms, create a new listing with the updated details." });
      load();
    } catch (err) {
      setModal({ title: "Cancel Failed", message: err.message || "Failed to cancel listing." });
    } finally {
      setCancelling(null);
    }
  };

  const total = (listings || []).length;
  const active = (listings || []).filter((l) => !l.isSold).length;
  const matched = (listings || []).filter((l) => l.isSold).length;
  const myListings = (listings || []).filter(
    (l) => user_account && l.owner === user_account
  );
  const recentActivity = [...(listings || [])]
    .sort((a, b) => (b.tradeId ?? 0) - (a.tradeId ?? 0))
    .slice(0, 6);

  return (
    <div className="Otc_main">
      {/* ── Header ── */}
      <DappHeader
        title="DASHBOARD"
        closeHeader={closeHeader}
        displayAccount={displayAccount}
        enableWeb3={enableWeb3}
      />

      {/* ── Page body ── */}
      <div style={{ padding: "0 0.5rem" }}>
        <div className="dash_page_header">
          <h6 className="Otc_main_txt" style={{ marginTop: "2rem" }}>
            Overview
          </h6>
          <button className="dash_refresh_btn" onClick={load} title="Refresh">
            <BsArrowRepeat size={16} />
          </button>
        </div>

        {loadError && (
          <div className="dapp_state dapp_state--error">
            <strong>Could not refresh market data</strong>
            <p>{loadError}</p>
            <button type="button" onClick={load}>Try again</button>
          </div>
        )}

        {/* ── Stats ── */}
        {loading ? (
          <div className="dash_loading_row">
            <Spinner size="md" color="default" />
          </div>
        ) : (
          <div className="dash_stats_row">
            <StatCard label="Total Listings" value={total} icon={BsBarChart} accent="#0097FF" />
            <StatCard label="Active" value={active} icon={BsPlusCircle} accent="#14F195" />
            <StatCard label="Matched" value={matched} icon={BsArrowLeftRight} accent="#7900D9" />
            <StatCard label="Clearance" value={clearance?.isCleared ? "Cleared" : "Not Cleared"} icon={BsShieldCheck} accent={clearance?.isCleared ? "#14F195" : "#f5a524"} />
          </div>
        )}

        {/* ── Clearance widget ── */}
        {!loading && (
          <div className="dash_section">
            <h6 className="dash_section_title">Compliance Status</h6>
            <div className="dash_clearance_row">
              <ClearanceBadge isCleared={clearance?.isCleared} clearanceType={clearance?.clearanceType} />
              {!clearance?.isCleared && (
                <Link to="/trades" className="dash_cta_link">
                  Browse listings to get clearance →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── My Listings ── */}
        <div className="dash_section">
          <h6 className="dash_section_title">My Listings</h6>
          {user_account && (
            <p className="dash_section_hint">
              To edit price or terms, cancel the active listing and create a new one.
            </p>
          )}

          {!user_account ? (
            <div className="dash_empty_state">
              <p>Connect your wallet to see your listings.</p>
              <button type="button" className="setupTrade_btn" style={{ width: "auto", padding: "0.5rem 1.5rem" }} onClick={enableWeb3}>
                Connect Wallet
              </button>
            </div>
          ) : loading ? (
            <div className="dash_loading_row">
              <Spinner size="sm" color="default" />
            </div>
          ) : myListings.length === 0 ? (
            <div className="dash_empty_state">
              <p>You have no active listings.</p>
              <Link to="/setuptrade" className="rfq_listing_card_btn">
                Create Listing
              </Link>
            </div>
          ) : (
            <div className="dash_my_listings">
              {myListings.map((l) => (
                <div key={l.tradeId} className="dash_my_listing_row">
                  <div className="dash_my_listing_row_left">
                    {l.isShielded && <PerBadge small />}
                    <div className="dash_my_listing_row_info">
                      <span className="dash_my_listing_row_type">{l.assetType}</span>
                      <span className="dash_my_listing_row_meta">
                        Min {l.minPrice.toLocaleString()} lamports · {l.tokenAmount.toLocaleString()} tokens
                      </span>
                    </div>
                  </div>
                  <div className="dash_my_listing_row_right">
                    <span className={`rfq_listing_card_status rfq_listing_card_status--${l.isSold ? "matched" : "active"}`}>
                      {l.isSold ? "Matched" : "Active"}
                    </span>
                    <Link to={`/trade_detail/${l.tradeId}`} className="dash_view_link">
                      View <FiExternalLink size={12} />
                    </Link>
                    {!l.isSold && (
                      <button
                        className="dash_cancel_btn"
                        disabled={cancelling === l.tradeId || !signTransaction}
                        onClick={() => handleCancel(l.tradeId)}
                      >
                        {cancelling === l.tradeId ? <Spinner size="sm" color="default" /> : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent Activity ── */}
        {!loading && recentActivity.length > 0 && (
          <div className="dash_section">
            <h6 className="dash_section_title">Recent Market Activity</h6>
            <div className="dash_activity_list">
              {recentActivity.map((l) => (
                <Link key={l.tradeId} to={`/trade_detail/${l.tradeId}`} className="dash_activity_row">
                  <div className="dash_activity_row_left">
                    <span className={`dash_activity_dot dash_activity_dot--${l.isSold ? "matched" : "active"}`} />
                    <span className="dash_activity_type">{l.assetType}</span>
                    {l.isShielded && <span className="dash_activity_per">PER</span>}
                  </div>
                  <div className="dash_activity_row_right">
                    <span className="dash_activity_price">{l.minPrice.toLocaleString()} lamports</span>
                    <span className={`rfq_listing_card_status rfq_listing_card_status--${l.isSold ? "matched" : "active"}`}>
                      {l.isSold ? "Matched" : "Active"}
                    </span>
                    <FiExternalLink size={13} color="#0097FF" />
                  </div>
                </Link>
              ))}
            </div>
            <Link to="/trades" className="dash_see_all_link">
              View all placements →
            </Link>
          </div>
        )}
      </div>

      {modal && (
        <EditableSuccessModal
          closeModal={() => setModal(null)}
          modal_title={modal.title}
          modal_message={modal.message}
        />
      )}
    </div>
  );
};

export default DashboardDapp;
