import { BsCheckLg, BsClipboard, BsIncognito } from "react-icons/bs";
import { BiInfoCircle } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import { IoMdMenu } from "react-icons/io";
import { EditableSuccessModal, ErrorModal2 } from "../components/backDropComponent";
import { useRef, useState, useContext } from "react";
import AppContext from "../context/Appcontext";
import { Spinner } from "@nextui-org/react";
import { createListing } from "../lib/rfq-client";
import TxStatusPanel from "../components/TxStatusPanel";

const ASSET_TYPES = [
  { id: 1, label: "SAFT (Simple Agreement for Future Tokens)" },
  { id: 2, label: "Vested Token" },
  { id: 3, label: "Vested Memecoin" },
  { id: 4, label: "SAFE (Simple Agreement for Future Equity)" },
  { id: 5, label: "Private Equity" },
  { id: 6, label: "Memecoin Equity" },
];

const VESTING_ASSET_TYPE_IDS = new Set([2, 3]);

const TRANSFER_RESTRICTION_OPTIONS = [
  { id: 0, label: "Unrestricted" },
  { id: 1, label: "Issuer / Admin Consent Required" },
  { id: 2, label: "Non-transferable" },
];

const SETTLEMENT_MODE_OPTIONS = [
  { id: 1, label: "TEE Verified Transfer Readiness" },
  { id: 2, label: "Escrow Release Workflow" },
  { id: 3, label: "Issuer / Admin Approval Workflow" },
];

const INITIAL_STEPS = [
  { label: "Delegate to PER", sig: null, explorerUrl: null, status: "pending" },
  { label: "Execute in TEE / PER", sig: null, explorerUrl: null, status: "pending" },
  { label: "Finalize listing state", sig: null, explorerUrl: null, status: "pending" },
  { label: "Anchor lister receipt on Solana", sig: null, explorerUrl: null, status: "pending" },
];

const offerUrlFor = (tradeId) => {
  if (!tradeId || typeof window === "undefined") return "";
  return `${window.location.origin}/trade_detail/${tradeId}`;
};

/* ── Section card wrapper ─────────────────────────────────────────────────── */
const SectionCard = ({ title, children }) => (
  <div className="setupTrade_section_card">
    <h6 className="setupTrade_section_card_title">{title}</h6>
    {children}
  </div>
);

/* ── Labelled field ───────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div className="setupTrade_field">
    <label className="setupTrade_field_label">{label}</label>
    {children}
  </div>
);

const SetuptradeDapp = ({ closeHeader }) => {
  const navigate = useNavigate();
  const txRef = useRef(null);
  const { enableWeb3, displayAccount, user_account, signTransaction } = useContext(AppContext);

  const [PrivateTrade, setPrivateTrade] = useState(false);
  const [assetType, setAssetType] = useState(ASSET_TYPES[0]);
  const [tokenTicker, setTokenTicker] = useState("");
  const [tokenMint, setTokenMint] = useState("");
  const [minPrice, setMinPrice] = useState("900000");
  const [tokenAmount, setTokenAmount] = useState("1000000000");
  const [valuationCap, setValuationCap] = useState("500000000");
  const [recepientWalletAddress, setrecepientWalletAddress] = useState("");
  const [vestingSourceProgram, setVestingSourceProgram] = useState("");
  const [vestingSourcePosition, setVestingSourcePosition] = useState("");
  const [vestingStartTs, setVestingStartTs] = useState("");
  const [vestingCliffTs, setVestingCliffTs] = useState("");
  const [vestingEndTs, setVestingEndTs] = useState("");
  const [unlockedAmount, setUnlockedAmount] = useState("0");
  const [claimedAmount, setClaimedAmount] = useState("0");
  const [transferRestrictionMode, setTransferRestrictionMode] = useState("0");
  const [settlementMode, setSettlementMode] = useState("1");
  const [settlementExpiresAt, setSettlementExpiresAt] = useState("");
  const [requiredSettlementAttestor, setRequiredSettlementAttestor] = useState("");
  const [requiredConsentAuthority, setRequiredConsentAuthority] = useState("");

  const [isLoading, setisLoading] = useState(false);
  const [displayError, setdisplayError] = useState(false);
  const [errorMessage, seterrorMessage] = useState("");
  const [txSteps, setTxSteps] = useState(null);
  const [txDone, setTxDone] = useState(false);
  const [txNote, setTxNote] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const isVestingAsset = VESTING_ASSET_TYPE_IDS.has(assetType.id);
  const requiresConsent = transferRestrictionMode === "1";
  const assetLabel = assetType.label.split(" (")[0];

  /* ── SOL conversion helpers ─────────────────────────────────────────────── */
  const LAMPORTS_PER_SOL = 1_000_000_000;
  const toSol = (lamports) => {
    const n = Number(lamports);
    if (!n || isNaN(n)) return null;
    return (n / LAMPORTS_PER_SOL).toLocaleString(undefined, { maximumFractionDigits: 6 });
  };
  const fromSol = (sol) => {
    const n = Number(sol);
    if (!n || isNaN(n)) return "";
    return String(Math.round(n * LAMPORTS_PER_SOL));
  };

  /* ── Fee preview ────────────────────────────────────────────────────────── */
  const feePreview = (() => {
    const p = Number(minPrice);
    if (!p || isNaN(p)) return null;
    const feeLamports = Math.round(p * 0.015);
    const feeSol = (feeLamports / LAMPORTS_PER_SOL).toLocaleString(undefined, { maximumFractionDigits: 6 });
    return `${feeLamports.toLocaleString()} lamports (≈ ${feeSol} SOL)`;
  })();

  /* ── +30 days helper ────────────────────────────────────────────────────── */
  const setPlus30Days = () => {
    const ts = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
    setSettlementExpiresAt(String(ts));
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch (_) {
      setShareCopied(false);
    }
  };

  const advanceStep = (index, sig, url) => {
    setTxSteps((prev) =>
      prev.map((s, i) => {
        if (i < index) return { ...s, status: "done" };
        if (i === index) return { ...s, status: "active", sig, explorerUrl: url };
        return s;
      })
    );
  };

  const failWithMessage = (message) => {
    setdisplayError(true);
    seterrorMessage(message);
    setisLoading(false);
  };

  const HandleCreateTrade = async () => {
    setisLoading(true);

    if (PrivateTrade && recepientWalletAddress.trim() === "") {
      failWithMessage("Please enter the recipient wallet address for a private placement.");
      return;
    }

    if (isVestingAsset) {
      if (!tokenMint.trim() || !vestingSourceProgram.trim() || !vestingSourcePosition.trim()) {
        failWithMessage("Token mint, vesting source program, and vesting position are required for vesting listings.");
        return;
      }
      if (!vestingStartTs || !vestingCliffTs || !vestingEndTs) {
        failWithMessage("Vesting start, cliff, and end timestamps are required.");
        return;
      }
      if (!requiredSettlementAttestor.trim()) {
        failWithMessage("A required settlement attestor is mandatory for vesting listings.");
        return;
      }
    }

    if (requiresConsent && !requiredConsentAuthority.trim()) {
      failWithMessage("A required consent authority is mandatory when issuer/admin consent is enabled.");
      return;
    }

    const steps = JSON.parse(JSON.stringify(INITIAL_STEPS));
    steps[0].status = "active";
    setTxSteps(steps);
    setShareUrl("");
    setShareCopied(false);

    // scroll to transaction panel
    setTimeout(() => txRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      advanceStep(0);
      await new Promise((r) => setTimeout(r, 1000));

      const result = await createListing({
        assetType: assetType.id,
        minPrice: Number(minPrice),
        tokenAmount: Number(tokenAmount),
        valuationCap: Number(valuationCap),
        tokenMint: tokenMint || null,
        vestingSourceProgram: vestingSourceProgram || null,
        vestingSourcePosition: vestingSourcePosition || null,
        vestingStartTs: vestingStartTs ? Number(vestingStartTs) : undefined,
        vestingCliffTs: vestingCliffTs ? Number(vestingCliffTs) : undefined,
        vestingEndTs: vestingEndTs ? Number(vestingEndTs) : undefined,
        unlockedAmount: unlockedAmount ? Number(unlockedAmount) : 0,
        claimedAmount: claimedAmount ? Number(claimedAmount) : 0,
        transferRestrictionMode: Number(transferRestrictionMode),
        settlementMode: isVestingAsset ? Number(settlementMode) : 0,
        settlementExpiresAt: settlementExpiresAt ? Number(settlementExpiresAt) : 0,
        requiredSettlementAttestor: requiredSettlementAttestor || null,
        requiredConsentAuthority: requiredConsentAuthority || null,
        isPrivate: PrivateTrade,
        recipient: recepientWalletAddress || null,
        seller: user_account || null,
      }, signTransaction);

      setTxSteps(result.steps.map((step) => ({ ...step, status: "done" })));

      const createdTradeId = result?.listing?.tradeId || result?.listingId;
      setShareUrl(offerUrlFor(createdTradeId));
      setTxNote(result.note);
      setTxDone(true);
      setisLoading(false);
    } catch (error) {
      setisLoading(false);
      setTxSteps(null);
      setdisplayError(true);
      seterrorMessage(error.message || "Transaction failed. Please try again.");
    }
  };

  return (
    <div className="Otc_main">
      <div className="Otc_main_header">
        <h5>LIST PRIVATE AGREEMENT</h5>

        <div className="Otc_main_header_spc">
          <IoMdMenu className="Otc_main_header_spc_ic" style={{ cursor: "pointer" }} onClick={closeHeader} />
          <Link className="Otc_main_header_spc_txt" to="/trades">RELAY</Link>
        </div>

        <div className="Otc_main_header_right">
          <div className="Otc_main_header_right_wallet otc_tophdvgt">
            {displayAccount ? (
              <div className="Otc_main_header_right_wallet_center">{displayAccount}</div>
            ) : (
              <div className="Otc_main_header_right_wallet_center" style={{ cursor: "pointer" }} onClick={() => enableWeb3()}>
                Connect Wallet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="Otc_main_body">
        <div className="setupTrade">
          {/* ── Title + Private toggle ── */}
          <div className="setupTrade_title">
            <h5>List a SAFT, SAFE, equity agreement, or vesting contract</h5>
            <div className="setupTrade_title_right">
              <h6>Private placement?</h6>
              <div
                className="setupTrade_title_right_switch"
                style={{ display: "flex", justifyContent: PrivateTrade ? "flex-end" : "flex-start", transition: "all .4s" }}
              >
                <div className="setupTrade_title_right_switch_div" style={{ transition: "all .4s" }} onClick={() => setPrivateTrade(!PrivateTrade)}>
                  <BsIncognito color="#373739" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section: Asset Info ── */}
          <SectionCard title="Asset Info">
            <Field label="Wallet">
              <p className="setupTrade_field_value">
                {displayAccount ? displayAccount : <span style={{ color: "#555" }}>Not connected (server wallet will be used)</span>}
              </p>
            </Field>

            <Field label="Asset Type">
              <select
                value={assetType.id}
                onChange={(e) => setAssetType(ASSET_TYPES.find((t) => t.id === Number(e.target.value)))}
                className="setupTrade_select"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </Field>

            {/* Ticker + Address for all types */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
              <Field label="Token Ticker / Symbol">
                <input
                  type="text"
                  placeholder="e.g. SOL, USDC, XYZ"
                  value={tokenTicker}
                  onChange={(e) => setTokenTicker(e.target.value.toUpperCase())}
                  className="setupTrade_field_input"
                  style={{ textTransform: "uppercase" }}
                />
              </Field>
              <Field label="Token Mint Address">
                <input
                  type="text"
                  placeholder="Solana token mint pubkey (optional for non-vesting)"
                  value={tokenMint}
                  onChange={(e) => setTokenMint(e.target.value)}
                  className="setupTrade_field_input"
                />
              </Field>
            </div>

            {PrivateTrade && (
              <Field label="Recipient Wallet Address">
                <input
                  type="text"
                  placeholder="Solana address..."
                  value={recepientWalletAddress}
                  onChange={(e) => setrecepientWalletAddress(e.target.value)}
                  className="setupTrade_field_input"
                />
              </Field>
            )}
          </SectionCard>

          {/* ── Section: Pricing ── */}
          <SectionCard title="Pricing">
            <Field label="Min Price">
              <div className="setupTrade_price_row">
                <input
                  type="number"
                  placeholder="900000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="setupTrade_field_input"
                />
                <div className="setupTrade_price_unit_toggle">
                  <span className="setupTrade_price_unit_active">lamports</span>
                  {toSol(minPrice) && <span className="setupTrade_price_unit_sol">≈ {toSol(minPrice)} SOL</span>}
                </div>
              </div>
            </Field>

            {feePreview && (
              <div className="setupTrade_fee_preview">
                <span>Performance fee (1.5%)</span>
                <span className="setupTrade_fee_value">{feePreview}</span>
              </div>
            )}

            <Field label="Token Amount (smallest unit)">
              <div className="setupTrade_price_row">
                <input
                  type="number"
                  placeholder="1000000000"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="setupTrade_field_input"
                />
                {tokenTicker && <span className="setupTrade_price_unit_sol">{Number(tokenAmount).toLocaleString()} {tokenTicker}</span>}
              </div>
            </Field>

            <Field label="Valuation Cap (in SOL)">
              <div className="setupTrade_price_row">
                <input
                  type="number"
                  placeholder="0.5"
                  step="0.01"
                  value={valuationCap ? (Number(valuationCap) / 1_000_000_000).toString() : ""}
                  onChange={(e) => setValuationCap(fromSol(e.target.value))}
                  className="setupTrade_field_input"
                />
                <span className="setupTrade_price_unit_active">SOL</span>
                {valuationCap && <span className="setupTrade_price_unit_sol">{Number(valuationCap).toLocaleString()} lamports</span>}
              </div>
            </Field>
          </SectionCard>

          {/* ── Section: Vesting Details (conditional) ── */}
          {isVestingAsset && (
            <SectionCard title="Vesting Details">
              <Field label="Vesting Source Program">
                <input type="text" placeholder="Program pubkey" value={vestingSourceProgram} onChange={(e) => setVestingSourceProgram(e.target.value)} className="setupTrade_field_input" />
              </Field>
              <Field label="Vesting Position">
                <input type="text" placeholder="Stream / escrow pubkey" value={vestingSourcePosition} onChange={(e) => setVestingSourcePosition(e.target.value)} className="setupTrade_field_input" />
              </Field>
              <Field label="Vesting Start (Unix seconds)">
                <input type="number" placeholder="Unix seconds" value={vestingStartTs} onChange={(e) => setVestingStartTs(e.target.value)} className="setupTrade_field_input" />
              </Field>
              <Field label="Vesting Cliff (Unix seconds)">
                <input type="number" placeholder="Unix seconds" value={vestingCliffTs} onChange={(e) => setVestingCliffTs(e.target.value)} className="setupTrade_field_input" />
              </Field>
              <Field label="Vesting End (Unix seconds)">
                <input type="number" placeholder="Unix seconds" value={vestingEndTs} onChange={(e) => setVestingEndTs(e.target.value)} className="setupTrade_field_input" />
              </Field>
              <Field label="Unlocked Amount">
                <input type="number" placeholder="0" value={unlockedAmount} onChange={(e) => setUnlockedAmount(e.target.value)} className="setupTrade_field_input" />
              </Field>
              <Field label="Claimed Amount">
                <input type="number" placeholder="0" value={claimedAmount} onChange={(e) => setClaimedAmount(e.target.value)} className="setupTrade_field_input" />
              </Field>
            </SectionCard>
          )}

          {/* ── Section: Settlement & Compliance ── */}
          {isVestingAsset && (
            <SectionCard title="Settlement & Compliance">
              <Field label="Settlement Mode">
                <select value={settlementMode} onChange={(e) => setSettlementMode(e.target.value)} className="setupTrade_select">
                  {SETTLEMENT_MODE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Settlement Expires At (Unix seconds)">
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <input
                    type="number"
                    placeholder="0 = no expiry"
                    value={settlementExpiresAt}
                    onChange={(e) => setSettlementExpiresAt(e.target.value)}
                    className="setupTrade_field_input"
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="setupTrade_helper_btn" onClick={setPlus30Days} title="+30 days from now">
                    +30 days
                  </button>
                </div>
              </Field>

              <Field label="Required Settlement Attestor">
                <input type="text" placeholder="Attestor pubkey" value={requiredSettlementAttestor} onChange={(e) => setRequiredSettlementAttestor(e.target.value)} className="setupTrade_field_input" />
              </Field>

              <Field label="Transfer Restriction">
                <select value={transferRestrictionMode} onChange={(e) => setTransferRestrictionMode(e.target.value)} className="setupTrade_select">
                  {TRANSFER_RESTRICTION_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </Field>

              {requiresConsent && (
                <Field label="Required Consent Authority">
                  <input type="text" placeholder="Issuer / admin pubkey" value={requiredConsentAuthority} onChange={(e) => setRequiredConsentAuthority(e.target.value)} className="setupTrade_field_input" />
                </Field>
              )}
            </SectionCard>
          )}

          <div className="setupTrade_list">
            <BiInfoCircle className="setupTrade_list_ic" />
            <h5>
              DealTerms stay confidential inside the Private Ephemeral Rollup. Vesting-backed listings can require settlement attestation, restricted listings can require issuer consent, and successful matches route native SOL atomically on settlement.
            </h5>
          </div>

          <button className="setupTrade_btn" disabled={isLoading} onClick={HandleCreateTrade}>
            {isLoading ? <Spinner color="default" size="sm" /> : `List ${assetLabel}`}
          </button>

          <div ref={txRef}>
            {txSteps && (
              <div style={{ marginTop: "2rem" }}>
                <TxStatusPanel
                  steps={txSteps}
                  title="Shielded RFQ Transaction"
                  note={txDone ? txNote : null}
                />
              </div>
            )}

            {shareUrl && (
              <div className="setupTrade_share_card">
                <div>
                  <span className="setupTrade_share_card_label">Shareable RFQ link</span>
                  <h6>Send this URL to a buyer, desk, market maker, or treasury counterparty.</h6>
                </div>
                <div className="setupTrade_share_card_url">
                  <span>{shareUrl}</span>
                  <button type="button" onClick={copyShareUrl} aria-label="Copy RFQ link">
                    {shareCopied ? <BsCheckLg /> : <BsClipboard />}
                    {shareCopied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="setupTrade_share_card_actions">
                  <Link to={shareUrl.replace(window.location.origin, "")}>Open offer</Link>
                  <button type="button" onClick={() => navigate("/trades")}>View market</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {displayError && (
        <ErrorModal2
          msg={errorMessage}
          closeModal={() => { setdisplayError(false); setisLoading(false); }}
        />
      )}

      {txDone && (
        <EditableSuccessModal
          closeModal={() => setTxDone(false)}
          modal_message={`Your ${assetLabel} listing was created. Copy the RFQ link to share this offer directly with a counterparty.`}
          modal_title="Placement Created"
        />
      )}
    </div>
  );
};

export default SetuptradeDapp;
