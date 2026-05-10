import { motion } from 'framer-motion';
import ComingSoonImg from '../assets/images/work-in-progress.png';

const ComingSoonModal = ({ closeModal }) => {
  return (
    <div
      className="backDrop"
      onClick={closeModal}
      style={{
        width: '100%',
      }}
    >
      <motion.div
        className='backDrop_getToken'
        style={{
          border: '2px solid white',
        }}
        initial={{ scale: 0.5 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 0.4 }}
        viewport={{ once: true }}
      >
        <img className='errorImg' alt='' src={ComingSoonImg} />

        <h3
          className='errorImg_top'
          style={{
            fontWeight: '800',
            fontFamily: "Raleway', sans-serif",
            fontSize: '1.4rem',
          }}
        >
          Coming Soon
        </h3>

        <h2 className='errorImg_btm'>
          We are migrating Relay to Solana. Wallet and transaction actions are disabled in this frontend preview.
        </h2>
      </motion.div>
    </div>
  );
};

const NormalBackdrop = ({ closeModal }) => {
  return (
    <motion.div className="backDrop" onClick={closeModal}></motion.div>
  );
};

export { ComingSoonModal, NormalBackdrop };
