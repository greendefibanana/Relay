import { Link, useParams } from "react-router-dom";
import { IoMdMenu } from "react-icons/io";
import { BsClipboard, BsCheckLg } from "react-icons/bs";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";
import { EditableSuccessModal } from "../components/backDropComponent";
import { useContext, useEffect, useState, useCallback } from "react";
import AppContext from "../context/Appcontext";
import { Spinner } from "@nextui-org/react";
import TransactionImg from "../assets/images/transaction.png";
import TxStatusPanel from "../components/TxStatusPanel";
import PerBadge from "../components/PerBadge";
import {
  attestVestingSettlement,
  getClearanceStatus,
  getListing,
  issueClearance,
  issueTransferConsent,
  matchOffer,
} from "../lib/rfq-client";
import ClearanceBadge from "../components/ClearanceBadge";

const MATCH_STEPS = [
  { label: "Delegate to PER", sig: null, explorerUrl: null, status: "pending" },
  { label: "Execute matchOffer in TEE / PER", sig: null, explorerUrl: null, status: "pending" },
  { label: "Commit AssetRegistry to Solana", sig: null, explorerUrl: null, status: "pending" },
];

const CLEARANCE_STEPS = [
  { label: "Delegate BuyerClearance to PER", sig: null, explorerUrl: null, status: "pending" },
  { label: "Execute issue_clearance in TEE / PER", sig: null, explorerUrl: null, status: "pending" },
  { label: "Keep BuyerClearance confidential in ER / PER", sig: null, explorerUrl: null, status: "pending" },
];

const SETTLEMENT_STEPS = [
  { label: "Delegate vesting state to ER / PER", sig: null, explorerUrl: null, status: "pending" },
  { label: "Attest vesting settlement in ER / PER", sig: null, explorerUrl: null, status: "pending" },
  { label: "Keep AssetRegistry confidential in ER / PER", sig: null, explorerUrl: null, status: "pending" },
];

const CONSENT_STEPS = [
  { label: "Delegate restricted listing state to ER / PER", sig: null, explorerUrl: null, status: "pending" },
  { label: "Issue transfer consent in ER / PER", sig: null, explorerUrl: null, status: "pending" },
  { label: "Keep AssetRegistry confidential in ER / PER", sig: null, explorerUrl: null, status: "pending" },
];

const settlementStatusLabel = (status) => {
  if (status === 3) return "Consumed";
  if (status === 2) return "Ready";
  if (status === 1) return "Pending";
  return "Not required";
};

const transferRestrictionLabel = (mode) => {
  if (mode === 2) return "Non-transferable";
  if (mode === 1) return "Issuer / Admin Consent";
  return "Unrestricted";
};

const isVestingAssetType = (assetTypeId) => assetTypeId === 2 || assetTypeId === 3;

/* ── Clipboard Button ─────────────────────────────────────────────────────── */
const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {}
  };
  return (
    <button onClick={handleCopy} className="trade_copy_btn" title="Copy to clipboard">
      {copied ? <BsCheckLg size={12} color="#14F195" /> : <BsClipboard size={12} />}
    </button>
  );
};

/* ── Vesting Timeline ─────────────────────────────────────────────────────── */
const VestingTimeline = ({ startTs, cliffTs, endTs }) => {
  if (!startTs || !endTs) return null;
  const fmt = (ts) => ts ? new Date(ts * 1000).toLocaleDateString() : "—";
  const total = endTs - startTs;
  const cliffPct = total > 0 && cliffTs ? Math.round(((cliffTs - startTs) / total) * 100) : 0;
  return (
    <div className="vesting_timeline">
      <div className="vesting_timeline_bar">
        <div className="vesting_timeline_fill" />
        {cliffPct > 0 && (
          <div className="vesting_timeline_cliff_marker" style={{ left: `${cliffPct}%` }}>
            <span className="vesting_timeline_cliff_label">Cliff</span>
          </div>
        )}
      </div>
      <div className="vesting_timeline_labels">
        <span>Start<br />{fmt(startTs)}</span>
        {cliffTs && <span style={{ marginLeft: `${cliffPct}%` }}>Cliff<br />{fmt(cliffTs)}</span>}
        <span style={{ marginLeft: "auto" }}>End<br />{fmt(endTs)}</span>
      </div>
    </div>
  );
};

/* ── Pre-match Checklist ──────────────────────────────────────────────────── */
const MatchChecklist = ({ isCleared, needsSettlement, needsConsent, reservedForOtherBuyer, isNonTransferable }) => {
  const items = [
    { label: "Buyer clearance issued", done: !!isCleared },
    ...(needsSettlement ? [{ label: "Settlement prepared", done: false }] : []),
    ...(needsConsent ? [{ label: "Issuer consent issued", done: false }] : []),
    ...(!reservedForOtherBuyer ? [] : [{ label: "You are the reserved buyer", done: false }]),
  ];
  if (items.every((i) => i.done) || isNonTransferable) return null;
  return (
    <div className="trade_checklist">
      <p className="trade_checklist_title">Complete to unlock Match Offer:</p>
      {items.map((item, i) => (
        <div key={i} className={`trade_checklist_item ${item.done ? "trade_checklist_item--done" : ""}`}>
          <span className="trade_checklist_dot">{item.done ? "✓" : "○"}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
};

const TradeOtc = ({ closeHeader }) => {
  const { enableWeb3, displayAccount, user_account, signTransaction } = useContext(AppContext);
  const { tradeId } = useParams();

  const [listing, setListing] = useState(null);
  const [clearance, setClearance] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [successMsg, setsuccessMsg] = useState(false);
  const [miniLoading, setminiLoading] = useState(false);
  const [clearanceLoading, setClearanceLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [txSteps, setTxSteps] = useState(null);
  const [clearanceSteps, setClearanceSteps] = useState(null);
  const [approvalSteps, setApprovalSteps] = useState(null);
  const [txDone, setTxDone] = useState(false);
  const [message, setMessage] = useState({ title: "", message: "" });

  const getListingData = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      setListing(await getListing(tradeId));
      if (user_account) {
        setClearance(await getClearanceStatus(user_account));
      }
    } catch {
      setListing(null);
    } finally {
      setLoadingTransactions(false);
    }
  }, [tradeId, user_account]);

  useEffect(() => {
    if (tradeId) {
      getListingData();
    }
  }, [tradeId, getListingData]);

  const completeStep = (steps, index, sig, url) =>
    steps.map((s, i) => {
      if (i < index) return { ...s, status: "done" };
      if (i === index) return { ...s, status: "done", sig, explorerUrl: url };
      if (i === index + 1) return { ...s, status: "active" };
      return s;
    });

  const runStepSequence = async ({ result, setSteps }) => {
    setSteps((prev) => completeStep(prev, 0, result.steps[0].sig, result.steps[0].explorerUrl));
    await new Promise((r) => setTimeout(r, 600));
    setSteps((prev) => completeStep(prev, 1, result.steps[1].sig, result.steps[1].explorerUrl));
    await new Promise((r) => setTimeout(r, 600));
    setSteps((prev) => completeStep(prev, 2, result.steps[2].sig, result.steps[2].explorerUrl));
  };

  const generateClearanceHandler = async () => {
    if (!user_account) return enableWeb3();
    setClearanceLoading(true);
    setApprovalSteps(null);
    setTxSteps(null);
    const initial = CLEARANCE_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" }));
    setClearanceSteps(initial);

    try {
      const result = await issueClearance({
        buyer: user_account,
        clearanceType: 1,
        expiresAt: "0",
      });
      await runStepSequence({ result, setSteps: setClearanceSteps });
      setClearanceLoading(false);
      setMessage({
        title: "Clearance Granted",
        message: "You have been cleared via Compliance-as-Code in the PER.",
      });
      setsuccessMsg(true);
      getListingData();
    } catch (error) {
      setClearanceLoading(false);
      setClearanceSteps(null);
      setMessage({
        title: "Clearance Failed",
        message: error.message || "Failed to issue clearance.",
      });
      setsuccessMsg(true);
    }
  };

  const prepareSettlementHandler = async () => {
    if (!user_account) return enableWeb3();
    setApprovalLoading(true);
    setClearanceSteps(null);
    setTxSteps(null);
    const initial = SETTLEMENT_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" }));
    setApprovalSteps(initial);

    try {
      const result = await attestVestingSettlement(tradeId, { buyer: user_account });
      await runStepSequence({ result, setSteps: setApprovalSteps });
      setApprovalLoading(false);
      setMessage({
        title: "Settlement Prepared",
        message: "Settlement readiness is now buyer-bound inside PER for this vesting listing.",
      });
      setsuccessMsg(true);
      getListingData();
    } catch (error) {
      setApprovalLoading(false);
      setApprovalSteps(null);
      setMessage({
        title: "Settlement Preparation Failed",
        message: error.message || "Failed to prepare settlement.",
      });
      setsuccessMsg(true);
    }
  };

  const issueConsentHandler = async () => {
    if (!user_account) return enableWeb3();
    setApprovalLoading(true);
    setClearanceSteps(null);
    setTxSteps(null);
    const initial = CONSENT_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" }));
    setApprovalSteps(initial);

    try {
      const result = await issueTransferConsent(tradeId, { buyer: user_account });
      await runStepSequence({ result, setSteps: setApprovalSteps });
      setApprovalLoading(false);
      setMessage({
        title: "Consent Issued",
        message: "Issuer / admin consent is now prepared for the current buyer.",
      });
      setsuccessMsg(true);
      getListingData();
    } catch (error) {
      setApprovalLoading(false);
      setApprovalSteps(null);
      setMessage({
        title: "Consent Failed",
        message: error.message || "Failed to issue transfer consent.",
      });
      setsuccessMsg(true);
    }
  };

  const acceptHandler = async () => {
    if (!user_account) return enableWeb3();
    setminiLoading(true);
    setClearanceSteps(null);
    setApprovalSteps(null);
    const initial = MATCH_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" }));
    setTxSteps(initial);

    try {
      const result = await matchOffer(tradeId, { buyer: user_account || null }, signTransaction);
      await runStepSequence({ result, setSteps: setTxSteps });
      setTxDone(true);
      setminiLoading(false);
      setMessage({
        title: "Offer Matched",
        message: "matchOffer executed inside PER. Native SOL payment routed atomically, AssetRegistry committed to Solana, and DealTerms remain confidential.",
      });
      setsuccessMsg(true);
      setTimeout(() => window.location.reload(), 4000);
    } catch (error) {
      setminiLoading(false);
      setTxSteps(null);
      setMessage({
        title: "Match Failed",
        message: error.message || "The match transaction failed.",
      });
      setsuccessMsg(true);
    }
  };

  const reservedForOtherBuyer =
    listing?.privateBuyer && user_account ? listing.privateBuyer !== user_account : false;
  const isNonTransferable = listing?.transferRestrictionMode === 2;
  const needsSettlement =
    listing && isVestingAssetType(listing.assetTypeId) && (listing.settlementStatus ?? 0) < 2;
  const needsConsent = listing && listing.transferRestrictionMode === 1 && (listing.consentStatus ?? 0) < 2;

  return (
    <div className="Otc_main">
      <div className="Otc_main_header">
        <h5>PLACEMENT DETAIL</h5>

        <div className="Otc_main_header_spc">
          <IoMdMenu className="Otc_main_header_spc_ic" style={{ cursor: "pointer" }} onClick={closeHeader} />
          <Link className="Otc_main_header_spc_txt" to="/trades">RELAY</Link>
        </div>

        <div className="Otc_main_header_right">
          <div className="Otc_main_header_right_wallet otc_tophdvgt">
            {displayAccount
              ? <div className="Otc_main_header_right_wallet_center">{displayAccount}</div>
              : <div className="Otc_main_header_right_wallet_center" style={{ cursor: "pointer" }} onClick={() => enableWeb3()}>Connect Wallet</div>}
          </div>
        </div>
      </div>

      {/* ── Back link ── */}
      <div style={{ padding: "1rem 1rem 0" }}>
        <Link to="/trades" className="trade_back_link">
          <FiArrowLeft size={14} /> Back to Market
        </Link>
      </div>

      <h6 className="Otc_main_txt">Placement Details</h6>

      <div className="Otc_main_body" style={{ minHeight: !listing ? "80vh" : "" }}>
        {!listing ? (
          loadingTransactions ? (
            <div style={{ height: "40vh", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Spinner size="md" color="default" />
            </div>
          ) : (
            <div style={{ width: "100%" }}>
              <img src={TransactionImg} alt="" style={{ width: "6rem", height: "6rem", objectFit: "contain", display: "block", margin: "3rem auto" }} />
              <h5 style={{ color: "white", textAlign: "center" }}>No Placement Found</h5>
            </div>
          )
        ) : (
          <div className="rfq_detail_card">
            {listing.isShielded && <PerBadge />}

            <div className="rfq_detail_card_header">
              <h4>{listing.assetType}</h4>
              <span className={`rfq_listing_card_status rfq_listing_card_status--${listing.isSold ? "matched" : "active"}`}>
                {listing.isSold ? "Matched" : "Active"}
              </span>
            </div>

            <div className="rfq_detail_card_grid">
              {listing.privateBuyer && (
                <div className="rfq_detail_card_field">
                  <label>Reserved Buyer</label>
                  <span className="rfq_listing_card_addr">{listing.privateBuyer.slice(0, 8)}...{listing.privateBuyer.slice(-6)}</span>
                </div>
              )}
              <div className="rfq_detail_card_field">
                <label>Min Price</label>
                <span>{listing.minPrice.toLocaleString()} lamports</span>
              </div>
              <div className="rfq_detail_card_field">
                <label>Token Amount</label>
                <span>{listing.tokenAmount.toLocaleString()}</span>
              </div>
              <div className="rfq_detail_card_field">
                <label>Valuation Cap</label>
                <span>{listing.valuationCap.toLocaleString()}</span>
              </div>
              <div className="rfq_detail_card_field">
                <label>Transfer Policy</label>
                <span>{transferRestrictionLabel(listing.transferRestrictionMode)}</span>
              </div>
              {isVestingAssetType(listing.assetTypeId) && (
                <div className="rfq_detail_card_field">
                  <label>Settlement Status</label>
                  <span>{settlementStatusLabel(listing.settlementStatus)}</span>
                </div>
              )}
              {listing.transferRestrictionMode === 1 && (
                <div className="rfq_detail_card_field">
                  <label>Consent Status</label>
                  <span>{settlementStatusLabel(listing.consentStatus)}</span>
                </div>
              )}
              <div className="rfq_detail_card_field">
                <label>Owner</label>
                <span className="rfq_listing_card_addr">{listing.owner.slice(0, 8)}...{listing.owner.slice(-6)}</span>
              </div>
              {/* AssetRegistry PDA with clipboard */}
              <div className="rfq_detail_card_field">
                <label>AssetRegistry PDA</label>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <a href={listing.explorerUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0097FF", fontSize: "0.8rem" }}>
                    {listing.pda.slice(0, 8)}...{listing.pda.slice(-6)}
                    <FiExternalLink />
                  </a>
                  <CopyBtn text={listing.pda} />
                </span>
              </div>
              <div className="rfq_detail_card_field">
                <label>DealTerms PDA</label>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="rfq_listing_card_addr" style={{ color: "#7900D9" }}>
                    Confidential (inside PER)
                  </span>
                </span>
              </div>
            </div>

            {/* ── Vesting Timeline ── */}
            {isVestingAssetType(listing.assetTypeId) && (
              <VestingTimeline
                startTs={listing.vestingStartTs}
                cliffTs={listing.vestingCliffTs}
                endTs={listing.vestingEndTs}
              />
            )}

            <div className="rfq_detail_card_info">
              <p>
                DealTerms are stored confidentially inside the Private Ephemeral Rollup. Every placement requires buyer clearance, while vesting-backed listings can also require settlement preparation and issuer consent before matching. Successful matches now route native SOL atomically during settlement.
              </p>
            </div>

            {/* ── Pre-match checklist ── */}
            {!listing.isSold && (
              <MatchChecklist
                isCleared={clearance?.isCleared}
                needsSettlement={needsSettlement}
                needsConsent={needsConsent}
                reservedForOtherBuyer={reservedForOtherBuyer}
                isNonTransferable={isNonTransferable}
              />
            )}

            <div style={{ margin: "1.5rem 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <ClearanceBadge isCleared={clearance?.isCleared} clearanceType={clearance?.clearanceType} />

              {!listing.isSold && (
                !clearance?.isCleared ? (
                  <button
                    className="setupTrade_btn setupTrade_btn--secondary"
                    disabled={clearanceLoading}
                    onClick={generateClearanceHandler}
                    style={{ background: "#f5a524", color: "white" }}
                  >
                    {clearanceLoading ? <Spinner size="sm" color="default" /> : "Get Clearance"}
                  </button>
                ) : isNonTransferable ? (
                  <button className="setupTrade_btn setupTrade_btn--secondary" disabled>
                    Non-transferable
                  </button>
                ) : reservedForOtherBuyer ? (
                  <button className="setupTrade_btn setupTrade_btn--secondary" disabled>
                    Reserved Listing
                  </button>
                ) : needsSettlement ? (
                  <button className="setupTrade_btn" disabled={approvalLoading} onClick={prepareSettlementHandler}>
                    {approvalLoading ? <Spinner size="sm" color="default" /> : "Prepare Settlement"}
                  </button>
                ) : needsConsent ? (
                  <button className="setupTrade_btn" disabled={approvalLoading} onClick={issueConsentHandler}>
                    {approvalLoading ? <Spinner size="sm" color="default" /> : "Issue Consent"}
                  </button>
                ) : (
                  <button className="setupTrade_btn" disabled={miniLoading} onClick={acceptHandler}>
                    {miniLoading ? <Spinner size="sm" color="default" /> : "Match Offer"}
                  </button>
                )
              )}
            </div>

            {clearanceSteps && !clearance?.isCleared && (
              <div style={{ marginTop: "1.5rem" }}>
                <TxStatusPanel
                  steps={clearanceSteps}
                  title="issueClearance Transaction"
                  note="Verifying user data via TEE and writing clearance back to Solana."
                />
              </div>
            )}

            {approvalSteps && (
              <div style={{ marginTop: "1.5rem" }}>
                <TxStatusPanel
                  steps={approvalSteps}
                  title="Approval Flow"
                  note="Buyer-bound approvals are prepared inside PER before matching."
                />
              </div>
            )}

            {txSteps && (
              <div style={{ marginTop: "1.5rem" }}>
                <TxStatusPanel
                  steps={txSteps}
                  title="matchOffer Transaction"
                  note={txDone ? "DealTerms remain confidential inside PER." : null}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {successMsg && (
        <EditableSuccessModal
          closeModal={() => setsuccessMsg(false)}
          modal_message={message.message}
          modal_title={message.title}
        />
      )}
    </div>
  );
};

export default TradeOtc;
