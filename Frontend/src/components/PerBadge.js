import { motion } from 'framer-motion';

/** Small "🔒 Shielded by PER" pill badge */
const PerBadge = ({ small = false }) => (
  <motion.div
    className={`perBadge ${small ? 'perBadge--small' : ''}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    🔒 Shielded by PER
  </motion.div>
);

export default PerBadge;
