import { motion } from 'framer-motion';
import { FiExternalLink } from 'react-icons/fi';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

/**
 * TxStatusPanel – animated transaction progress display.
 * steps: [{ label, sig, explorerUrl, status: 'pending'|'active'|'done' }]
 */
const TxStatusPanel = ({ steps, title = 'Transaction Progress', note }) => {
  return (
    <motion.div
      className="txPanel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h5 className="txPanel_title">{title}</h5>

      <div className="txPanel_steps">
        {steps.map((step, i) => (
          <div key={i} className={`txPanel_step txPanel_step--${step.status}`}>
            <div className="txPanel_step_icon">
              {step.status === 'done' && <IoCheckmarkCircle className="txPanel_step_icon_done" />}
              {step.status === 'active' && (
                <AiOutlineLoading3Quarters className="txPanel_step_icon_spin" />
              )}
              {step.status === 'pending' && <div className="txPanel_step_icon_pending" />}
            </div>

            <div className="txPanel_step_content">
              <h6 className="txPanel_step_label">{i + 1}. {step.label}</h6>
              {step.status === 'done' && step.sig && step.explorerUrl && (
                <a
                  href={step.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="txPanel_step_sig"
                >
                  {step.sig.slice(0, 12)}…{step.sig.slice(-6)}
                  <FiExternalLink className="txPanel_step_sig_ic" />
                </a>
              )}
              {step.status === 'active' && (
                <span className="txPanel_step_loading">Processing transaction…</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {note && <p className="txPanel_note">🔒 {note}</p>}
    </motion.div>
  );
};

export default TxStatusPanel;
