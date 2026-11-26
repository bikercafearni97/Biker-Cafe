import { motion } from 'framer-motion';
import { Mail, MapPin, Navigation, Phone } from 'lucide-react';
import MagneticButton from '../ui/MagneticButton';
import WhatsAppIcon from '../ui/WhatsAppIcon';
import {
  buildWhatsAppUrl,
  CLIENT_PLACEHOLDER_INFO,
  HOME_WHATSAPP_MESSAGE,
} from '../../data/showroomPlaceholders';
import './ClosingShowcase.css';

export default function ClosingShowcase() {
  return (
    <section className="closing section-pad">
      <div className="container">
        <motion.div
          className="closing__panel"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="closing__glow" aria-hidden="true" />
          <div className="closing__stripe" aria-hidden="true" />

          <div className="closing__content">
            <span className="eyebrow">
              Visit {CLIENT_PLACEHOLDER_INFO.brandName} // {CLIENT_PLACEHOLDER_INFO.locationLabel}
            </span>
            <h2 className="closing__title">
              Built For Riders Who Demand{' '}
              <span className="metallic-text">Precision Protection</span>
            </h2>
            <p className="closing__copy">
              Step into our {CLIENT_PLACEHOLDER_INFO.locationLabel} showroom to compare shell
              ergonomics, visor clarity, and helmet fitment in person.
            </p>

            <div className="closing__details">
              <div className="closing__detail-item">
                <MapPin size={15} aria-hidden="true" />
                <span>{CLIENT_PLACEHOLDER_INFO.fullAddress}</span>
              </div>
              <div className="closing__detail-links">
                <a href={CLIENT_PLACEHOLDER_INFO.phoneHref} className="closing__contact-link">
                  <Phone size={14} aria-hidden="true" />
                  <span>{CLIENT_PLACEHOLDER_INFO.phone}</span>
                </a>
                <a href={CLIENT_PLACEHOLDER_INFO.emailHref} className="closing__contact-link">
                  <Mail size={14} aria-hidden="true" />
                  <span>{CLIENT_PLACEHOLDER_INFO.email}</span>
                </a>
              </div>
            </div>

            <div className="closing__actions">
              <MagneticButton
                href={buildWhatsAppUrl(HOME_WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                icon={WhatsAppIcon}
              >
                Enquire on WhatsApp
              </MagneticButton>
              <MagneticButton
                href={CLIENT_PLACEHOLDER_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="silver"
                icon={Navigation}
              >
                Get Directions
              </MagneticButton>
              <MagneticButton href={CLIENT_PLACEHOLDER_INFO.phoneHref} variant="silver" icon={Phone}>
                Call Showroom
              </MagneticButton>
              <span className="closing__owner">{CLIENT_PLACEHOLDER_INFO.ownerCredit}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
