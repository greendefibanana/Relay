import { BsChevronDown, BsIncognito, BsArrowRepeat } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";
import { Link } from "react-router-dom";
import { IoMdMenu } from "react-icons/io";
import { SuccessModal } from "../components/backDropComponent";
import { useContext, useEffect, useState } from "react";
import AppContext from "../context/Appcontext";
import { Spinner } from "@nextui-org/react";
import TransactionImg from "../assets/images/transaction.png";
import PerBadge from "../components/PerBadge";
import { getListings } from "../lib/rfq-client";
import { FiExternalLink } from "react-icons/fi";

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rfq_listing_card rfq_skeleton_card">
    <div className="rfq_skel rfq_skel--header" />
    <div className="rfq_skel rfq_skel--row" />
    <div className="rfq_skel rfq_skel--row" />
    <div className="rfq_skel rfq_skel--row" />
    <div className="rfq_skel rfq_skel--footer" />
  </div>
);

const OtcDapp = ({ closeHeader }) => {
  const { enableWeb3, displayAccount } = useContext(AppContext);

  const [listings, setListings] = useState(null);
  const [LoadingTransactions, setLoadingTransactions] = useState(true);
  const [showPrivate, setshowPrivate] = useState(false);
  const [successMsg, setsuccessMsg] = useState(false);
  const [Filters, setFilters] = useState("");
  const [search, setSearch] = useState("");

  const loadListings = async () => {
    setLoadingTransactions(true);
    try {
      const data = await getListings();
      setListings(data);
    } catch {
      setListings([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const filterContent = (
    <PopoverContent>
      <div className="Otc_main_modal">
        <Link to="#" className="Otc_main_modal_link" onClick={() => setFilters("")}><h6>All Placements</h6></Link>
        <Link to="#" className="Otc_main_modal_link" onClick={() => setFilters("active")}><h6>Active</h6></Link>
        <Link to="#" className="Otc_main_modal_link" onClick={() => setFilters("matched")}><h6>Matched</h6></Link>
      </div>
    </PopoverContent>
  );

  const filtered = (listings || []).filter((l) => {
    if (showPrivate && !l.isPrivate && !l.isShielded) return false;
    if (Filters === "active" && l.isSold) return false;
    if (Filters === "matched" && !l.isSold) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!l.assetType?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filterLabel = Filters === "" ? "All Placements" : Filters === "active" ? "Active" : "Matched";

  return (
    <div className="Otc_main">
      <div className="Otc_main_header">
        <h5>SECONDARY MARKET</h5>

        <div className="Otc_main_header_spc">
          <IoMdMenu className="Otc_main_header_spc_ic" style={{ cursor: "pointer" }} onClick={closeHeader} />
          <Link className="Otc_main_header_spc_txt" to="/trades">RELAY</Link>
        </div>

        <div className="Otc_main_header_right">
          <div className="Otc_main_header_right_live">
            <div className="solana_dot" />
            <h6>Solana Devnet</h6>
          </div>
          <div className="Otc_main_header_right_wallet otc_tophdvgt">
            {displayAccount
              ? <div className="Otc_main_header_right_wallet_center">{displayAccount}</div>
              : <div className="Otc_main_header_right_wallet_center" style={{ cursor: "pointer" }} onClick={() => enableWeb3()}>Connect Wallet</div>
            }
          </div>
        </div>
      </div>

      <h6 className="Otc_main_txt">Placements</h6>

      <div className="Otc_main_options">
        <div className="Otc_main_options_left">
          <Popover key="bottom-end" placement="bottom" color="primary">
            <PopoverTrigger>
              <div className="Otc_main_options_cov">
                <button className="Otc_main_options_cov_btn">
                  {filterLabel}
                  <BsChevronDown className="Otc_main_options_cov_btn_ic" />
                </button>
              </div>
            </PopoverTrigger>
            {filterContent}
          </Popover>

          {/* Search bar */}
          <div className="otc_search_bar">
            <BiSearch className="otc_search_bar_ic" />
            <input
              type="text"
              placeholder="Search by asset type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="otc_search_bar_input"
            />
          </div>
        </div>

        <div className="Otc_main_options_right">
          {/* Refresh */}
          <button className="otc_refresh_btn" onClick={loadListings} title="Refresh listings" disabled={LoadingTransactions}>
            {LoadingTransactions ? <Spinner size="sm" color="default" /> : <BsArrowRepeat size={16} />}
          </button>

          <h6>Show Shielded (PER)</h6>
          <div
            className="setupTrade_title_right_switch"
            style={{ display: "flex", justifyContent: showPrivate ? "flex-end" : "flex-start", transition: "all .4s" }}
          >
            <div className="setupTrade_title_right_switch_div" style={{ transition: "all .4s" }} onClick={() => setshowPrivate(!showPrivate)}>
              <BsIncognito color="#373739" />
            </div>
          </div>
        </div>
      </div>

      <div className="Otc_main_body otc_grid_body" style={{ minHeight: "80vh", alignItems: "flex-start" }}>
        {LoadingTransactions ? (
          // Skeleton cards
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <div style={{ width: "100%" }}>
            <img src={TransactionImg} alt="" style={{ width: "6rem", height: "6rem", objectFit: "contain", display: "block", margin: "3rem auto" }} />
            <h5 style={{ color: "white", textAlign: "center" }}>No Placements Found</h5>
            {search && <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", fontFamily: "var(--raleway)", marginTop: "0.5rem" }}>Try clearing the search</p>}
          </div>
        ) : (
          filtered.map((listing, idx) => (
            <div key={idx} className="rfq_listing_card">
              {listing.isShielded && <PerBadge small />}

              <div className="rfq_listing_card_header">
                <span className="rfq_listing_card_type">{listing.assetType}</span>
                <span className={`rfq_listing_card_status rfq_listing_card_status--${listing.isSold ? "matched" : "active"}`}>
                  {listing.isSold ? "Matched" : "Active"}
                </span>
              </div>

              <div className="rfq_listing_card_row">
                <span>Min Price</span>
                <span>{listing.minPrice.toLocaleString()} lamports</span>
              </div>
              <div className="rfq_listing_card_row">
                <span>Token Amount</span>
                <span>{listing.tokenAmount.toLocaleString()}</span>
              </div>
              <div className="rfq_listing_card_row">
                <span>Valuation Cap</span>
                <span>{listing.valuationCap.toLocaleString()}</span>
              </div>
              <div className="rfq_listing_card_row">
                <span>Owner</span>
                <span className="rfq_listing_card_addr">{listing.owner.slice(0, 6)}…{listing.owner.slice(-4)}</span>
              </div>

              <div className="rfq_listing_card_footer">
                <a href={listing.explorerUrl} target="_blank" rel="noreferrer" className="rfq_listing_card_link">
                  View Registry <FiExternalLink />
                </a>
                <Link to={`/trade_detail/${listing.tradeId}`} className="rfq_listing_card_btn">
                  {listing.isSold ? "View Details" : "Match Offer"}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {successMsg && <SuccessModal closeModal={() => setsuccessMsg(false)} />}
    </div>
  );
};

export default OtcDapp;
