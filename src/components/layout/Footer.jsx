import { Link } from 'react-router-dom';
import { ArrowUp, ExternalLink, Mail, MapPin, Phone, User } from 'lucide-react';
import { motion } from 'framer-motion';
import BikerCafeLogo from '../brand/BikerCafeLogo';
import { CLIENT_PLACEHOLDER_INFO } from '../../data/showroomPlaceholders';
import './Footer.css';

const FOOTER_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Helmet Showroom', to: '/showroom' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="visit" className="footer">
      <div className="footer__accent-line" aria-hidden="true" />

      <div className="container footer__grid">
        <motion.div
          className="footer__brand-col"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <BikerCafeLogo size="md" />
          <p className="footer__desc">
            A dedicated motorcycle and helmet showroom in {CLIENT_PLACEHOLDER_INFO.locationLabel}{' '}
            engineered around precision fitment, aerodynamic craftsmanship, and rider culture.
          </p>
          <p className="footer__owner">
            <User size={14} aria-hidden="true" />
            <span>{CLIENT_PLACEHOLDER_INFO.ownerCredit}</span>
          </p>
        </motion.div>

        <motion.div
          className="footer__info-col"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          <h3 className="footer__heading">Explore</h3>
          <ul className="footer__nav-list">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="footer__nav-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="footer__info-col"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <h3 className="footer__heading">Showroom Location</h3>
          <ul className="footer__list">
            <li>
              <MapPin size={16} aria-hidden="true" />
              <address className="footer__address">
                {CLIENT_PLACEHOLDER_INFO.addressLine1},
                <br />
                {CLIENT_PLACEHOLDER_INFO.addressLine2}
              </address>
            </li>
            <li>
              <ExternalLink size={16} aria-hidden="true" />
              <a
                href={CLIENT_PLACEHOLDER_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__link"
              >
                Google Maps Directions
              </a>
            </li>
          </ul>
        </motion.div>

        <motion.div
          className="footer__info-col"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: 0.15 }}
        >
          <h3 className="footer__heading">Direct Contact</h3>
          <ul className="footer__list">
            <li>
              <Phone size={16} aria-hidden="true" />
              <a href={CLIENT_PLACEHOLDER_INFO.phoneHref} className="footer__link">
                {CLIENT_PLACEHOLDER_INFO.phone}
              </a>
            </li>
            <li>
              <Mail size={16} aria-hidden="true" />
              <a href={CLIENT_PLACEHOLDER_INFO.emailHref} className="footer__link">
                {CLIENT_PLACEHOLDER_INFO.email}
              </a>
            </li>
          </ul>
        </motion.div>
      </div>

      <div className="container footer__bottom">
        <p className="footer__copy">
          &copy; {new Date().getFullYear()} {CLIENT_PLACEHOLDER_INFO.brandName} &mdash;{' '}
          {CLIENT_PLACEHOLDER_INFO.locationLabel}.
        </p>

        <button type="button" className="footer__top-btn" onClick={scrollToTop}>
          <span>Back to Top</span>
          <ArrowUp size={15} aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
