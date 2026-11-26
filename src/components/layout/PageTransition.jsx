import { motion } from 'framer-motion';
import './PageTransition.css';

export default function PageTransition({ children }) {
  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="page-transition__accent"
        aria-hidden="true"
        initial={{ scaleX: 1, opacity: 0.9 }}
        animate={{ scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      />
      {children}
    </motion.div>
  );
}
