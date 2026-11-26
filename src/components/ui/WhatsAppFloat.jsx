import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { buildWhatsAppUrl, HOME_WHATSAPP_MESSAGE } from '../../data/showroomPlaceholders';
import WhatsAppIcon from './WhatsAppIcon';
import './WhatsAppFloat.css';

export default function WhatsAppFloat() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;

  const href = buildWhatsAppUrl(HOME_WHATSAPP_MESSAGE);

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-float"
      aria-label="Enquire with BIKER CAFE on WhatsApp"
      initial={{ opacity: 0, y: 18, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="wa-float__pulse" aria-hidden="true" />
      <span className="wa-float__icon">
        <WhatsAppIcon size={20} />
      </span>
      <span className="wa-float__label">WhatsApp</span>
    </motion.a>
  );
}
