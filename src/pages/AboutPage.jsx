import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Shield, User, Wrench, Layers } from 'lucide-react';
import { ABOUT_CATEGORIES, CLIENT_PLACEHOLDER_INFO } from '../data/showroomPlaceholders';
import MagneticButton from '../components/ui/MagneticButton';
import ClosingShowcase from '../components/showroom/ClosingShowcase';
import PageSeo from '../components/seo/PageSeo';
import './AboutPage.css';

const CATEGORY_ICONS = [Shield, Wrench, Layers];

export default function AboutPage() {
  return (
    <div className="about-page">
      <PageSeo
        title="About BIKER CAFE — ARNI | Riding Gears, Bike Modification & Accessories"
        description="Learn about BIKER CAFE in Arni, Tamil Nadu, owned and managed by A. Narasimman — bringing helmets, riding gears, bike modification, and accessories together."
        robots="index, follow"
      />
      {/* Cinematic Motorcycle-Themed Hero */}
      <section className="about-hero">
        <div className="about-hero__glow" aria-hidden="true" />
        <div className="container about-hero__grid">
          <motion.div
            className="about-hero__copy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="eyebrow">
              About {CLIENT_PLACEHOLDER_INFO.brandName} // {CLIENT_PLACEHOLDER_INFO.locationLabel}
            </span>
            <h1 className="about-hero__title">
              BUILT AROUND <span className="metallic-text">RIDERS &amp; MACHINES</span>
            </h1>
            <p className="about-hero__lead">
              {CLIENT_PLACEHOLDER_INFO.brandName} is a motorcycle, helmet, and rider lifestyle
              showroom located in {CLIENT_PLACEHOLDER_INFO.locationLabel}, Tamil Nadu, bringing
              together riding gears, bike modification, and accessories under one roof.
            </p>

            <div className="about-hero__meta">
              <span className="about-meta-pill">
                <User size={14} aria-hidden="true" />
                <span>Owner: {CLIENT_PLACEHOLDER_INFO.ownerName}</span>
              </span>
              <span className="about-meta-pill">
                <MapPin size={14} aria-hidden="true" />
                <span>{CLIENT_PLACEHOLDER_INFO.locationLabel}, Tamil Nadu</span>
              </span>
            </div>

            <div className="about-hero__actions">
              <MagneticButton to="/showroom" variant="primary" icon={ArrowRight}>
                Explore Helmet Showroom
              </MagneticButton>
              <MagneticButton to="/contact" variant="silver">
                Contact Showroom
              </MagneticButton>
            </div>
          </motion.div>

          {/* Lightweight Superbike & Speed-Line SVG Artwork */}
          <motion.div
            className="about-hero__visual carbon-grid-bg"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="aboutRed" x1="20" y1="60" x2="470" y2="240" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#e11d2a" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#ff2e3b" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#e11d2a" stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="aboutMetal" x1="80" y1="40" x2="420" y2="260" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f2f5fa" />
                  <stop offset="55%" stopColor="#9fa7b5" />
                  <stop offset="100%" stopColor="#cfd5df" />
                </linearGradient>
              </defs>

              {/* Wind-tunnel aerodynamic speed lines */}
              <motion.path
                d="M16 90 C 120 68, 220 66, 330 78"
                stroke="url(#aboutRed)"
                strokeWidth="1.6"
                strokeDasharray="10 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
              <motion.path
                d="M24 246 H 472"
                stroke="url(#aboutMetal)"
                strokeOpacity="0.45"
                strokeWidth="1.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
              />

              {/* Rear & Front Superbike Wheels + Twin Disc Rotors */}
              <circle cx="132" cy="204" r="40" stroke="url(#aboutMetal)" strokeWidth="2.8" />
              <circle cx="132" cy="204" r="24" stroke="#545b69" strokeWidth="1.2" strokeDasharray="5 4" />
              <circle cx="132" cy="204" r="14" stroke="#e11d2a" strokeWidth="2" />

              <circle cx="372" cy="204" r="40" stroke="url(#aboutMetal)" strokeWidth="2.8" />
              <circle cx="372" cy="204" r="25" stroke="#cfd5df" strokeOpacity="0.55" strokeWidth="1.3" strokeDasharray="6 4" />
              <circle cx="372" cy="204" r="14" stroke="#e11d2a" strokeWidth="2" />

              {/* Swingarm, Inverted Front Forks & Under-belly Exhaust */}
              <motion.path
                d="M132 204 L212 184 L268 188 L302 104 L344 106 L372 204"
                stroke="url(#aboutMetal)"
                strokeWidth="2.4"
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.3, ease: 'easeInOut' }}
              />
              <path d="M180 198 L244 198 L224 210 L172 206 Z" fill="#151821" stroke="#e11d2a" strokeWidth="1.4" />

              {/* Sculpted Aggressive Fairing, Windscreen & Tail Cowl */}
              <motion.path
                d="M84 114 L138 122 L192 142 L226 116 L286 106 L326 84 L348 94 L388 126 L360 158 L286 184 L208 182 L176 146 L112 132 Z"
                fill="rgba(225, 29, 42, 0.1)"
                stroke="url(#aboutRed)"
                strokeWidth="2.1"
                strokeLinejoin="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.35 }}
              />
              {/* Headlight DRL & Tail Light Accent */}
              <path d="M362 124 L386 128" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M88 115 L106 119" stroke="#ff2e3b" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="about-hero__visual-caption">
              <span>{CLIENT_PLACEHOLDER_INFO.brandName} // SUPERBIKE PROFILE</span>
              <span>{CLIENT_PLACEHOLDER_INFO.locationLabel}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Brand Introduction & Ownership */}
      <section className="about-intro section-pad">
        <div className="container about-intro__grid">
          <motion.div
            className="about-intro__card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
          >
            <span className="eyebrow">Brand Overview</span>
            <h2 className="section-heading">
              A Dedicated Space For <span className="metallic-text">Motorcycle Culture</span>
            </h2>
            <p className="about-intro__copy">
              {CLIENT_PLACEHOLDER_INFO.brandName} in {CLIENT_PLACEHOLDER_INFO.locationLabel} serves
              motorcyclists looking to inspect helmets, riding gear, bike modification options, and
              accessories in an environment designed around clarity and craftsmanship.
            </p>
          </motion.div>

          <motion.div
            className="about-owner-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, delay: 0.08 }}
          >
            <span className="about-owner-card__kicker">Leadership</span>
            <h3 className="about-owner-card__name">{CLIENT_PLACEHOLDER_INFO.ownerName}</h3>
            <p className="about-owner-card__role">{CLIENT_PLACEHOLDER_INFO.ownerCredit}</p>
            <p className="about-owner-card__addr">{CLIENT_PLACEHOLDER_INFO.fullAddress}</p>
          </motion.div>
        </div>
      </section>

      {/* Confirmed Business Categories */}
      <section className="about-categories section-pad">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">What We Focus On</span>
              <h2 className="section-heading">
                Core <span className="metallic-text">Showroom Categories</span>
              </h2>
            </div>
          </div>

          <div className="about-categories__grid">
            {ABOUT_CATEGORIES.map((item, idx) => {
              const Icon = CATEGORY_ICONS[idx % CATEGORY_ICONS.length];
              return (
                <motion.article
                  key={item.index}
                  className="about-cat-card"
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="about-cat-card__top">
                    <span className="about-cat-card__tag">{item.tag}</span>
                    <span className="about-cat-card__icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                  </div>
                  <span className="about-cat-card__watermark" aria-hidden="true">
                    {item.index}
                  </span>
                  <h3 className="about-cat-card__title">{item.title}</h3>
                  <p className="about-cat-card__desc">{item.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <ClosingShowcase />
    </div>
  );
}
