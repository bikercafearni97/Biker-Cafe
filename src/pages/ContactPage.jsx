import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Send,
  User,
} from 'lucide-react';
import {
  buildWhatsAppUrl,
  CLIENT_PLACEHOLDER_INFO,
  HOME_WHATSAPP_MESSAGE,
  INQUIRY_TOPICS,
} from '../data/showroomPlaceholders';
import { ENQUIRY_LIMITS, submitEnquiry } from '../services/enquiriesService';
import MagneticButton from '../components/ui/MagneticButton';
import WhatsAppIcon from '../components/ui/WhatsAppIcon';
import PageSeo from '../components/seo/PageSeo';
import './ContactPage.css';

const INITIAL_FORM = {
  name: '',
  contact: '',
  topic: INQUIRY_TOPICS[0],
  message: '',
};

export default function ContactPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState(null);

  const handleChange = (field) => (e) => {
    setErrorMsg('');
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const buildMailtoHref = (payload) => {
    const subject = `[BIKER CAFE Inquiry] ${payload.topic} — ${payload.name}`;
    const bodyLines = [
      `Name: ${payload.name}`,
      `Phone / Email: ${payload.contact}`,
      `Topic: ${payload.topic}`,
      '',
      'Message:',
      payload.message,
    ];
    return `mailto:${CLIENT_PLACEHOLDER_INFO.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const saved = await submitEnquiry(formData);
      setSubmittedEnquiry(saved);
      setFormData(INITIAL_FORM);
    } catch (err) {
      if (err?.code === 'permission-denied') {
        setErrorMsg(
          'Online enquiry submission is temporarily unavailable. Please reach us via WhatsApp, phone call, or email.'
        );
      } else {
        setErrorMsg(
          err?.message || 'Unable to send your enquiry right now. Please try WhatsApp or call us directly.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <PageSeo
        title="Contact & Visit BIKER CAFE — ARNI | 123, Karthikeyan Road, Arni"
        description="Visit BIKER CAFE at 123, Karthikeyan Road, Arni – 632301, Tamil Nadu. Call +91 73958 56611, chat on WhatsApp, get Google Maps directions, or send an enquiry."
        robots="index, follow"
      />
      {/* Header Banner */}
      <section className="contact-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="eyebrow">
              Contact {CLIENT_PLACEHOLDER_INFO.brandName} // {CLIENT_PLACEHOLDER_INFO.locationLabel}
            </span>
            <h1 className="contact-hero__title">
              VISIT OR REACH <span className="metallic-text">THE SHOWROOM</span>
            </h1>
            <p className="contact-hero__copy">
              Connect directly with our {CLIENT_PLACEHOLDER_INFO.locationLabel} showroom by phone,
              WhatsApp, email, or Google Maps directions, or send an enquiry directly below.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main 2-Column Contact Info + Inquiry Form */}
      <section className="contact-body section-pad">
        <div className="container contact-grid">
          {/* Official Showroom Details */}
          <motion.div
            className="contact-info-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <div className="contact-info-card__head">
              <span className="contact-info-card__kicker">Official Showroom Details</span>
              <h2 className="contact-info-card__brand">
                {CLIENT_PLACEHOLDER_INFO.brandName} &mdash;{' '}
                {CLIENT_PLACEHOLDER_INFO.locationLabel}
              </h2>
              <p className="contact-info-card__owner">
                <User size={14} aria-hidden="true" />
                <span>{CLIENT_PLACEHOLDER_INFO.ownerCredit}</span>
              </p>
            </div>

            <div className="contact-details-list">
              <div className="contact-detail-row">
                <MapPin size={18} aria-hidden="true" />
                <div>
                  <span className="contact-detail-label">Showroom Address</span>
                  <address className="contact-detail-val">
                    {CLIENT_PLACEHOLDER_INFO.addressLine1},
                    <br />
                    {CLIENT_PLACEHOLDER_INFO.addressLine2}
                  </address>
                </div>
              </div>

              <div className="contact-detail-row">
                <Phone size={18} aria-hidden="true" />
                <div>
                  <span className="contact-detail-label">Phone</span>
                  <a href={CLIENT_PLACEHOLDER_INFO.phoneHref} className="contact-detail-link">
                    {CLIENT_PLACEHOLDER_INFO.phone}
                  </a>
                </div>
              </div>

              <div className="contact-detail-row">
                <Mail size={18} aria-hidden="true" />
                <div>
                  <span className="contact-detail-label">Email</span>
                  <a href={CLIENT_PLACEHOLDER_INFO.emailHref} className="contact-detail-link">
                    {CLIENT_PLACEHOLDER_INFO.email}
                  </a>
                </div>
              </div>

              <div className="contact-detail-row">
                <WhatsAppIcon size={18} />
                <div>
                  <span className="contact-detail-label">WhatsApp</span>
                  <a
                    href={buildWhatsAppUrl(HOME_WHATSAPP_MESSAGE)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-detail-link"
                  >
                    {CLIENT_PLACEHOLDER_INFO.whatsappDisplay}
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-quick-actions">
              <MagneticButton
                href={buildWhatsAppUrl(HOME_WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                icon={WhatsAppIcon}
              >
                WhatsApp Enquiry
              </MagneticButton>
              <MagneticButton href={CLIENT_PLACEHOLDER_INFO.phoneHref} variant="silver" icon={Phone}>
                Call Showroom
              </MagneticButton>
              <MagneticButton href={CLIENT_PLACEHOLDER_INFO.emailHref} variant="silver" icon={Mail}>
                Email Directly
              </MagneticButton>
              <MagneticButton
                href={CLIENT_PLACEHOLDER_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="silver"
                icon={Navigation}
              >
                Google Maps Directions
              </MagneticButton>
            </div>
          </motion.div>

          {/* Showroom Enquiry Form */}
          <motion.div
            className="contact-form-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <div className="contact-form-card__head">
              <h2 className="contact-form-card__title">Send a Showroom Enquiry</h2>
              <p className="contact-form-card__sub">
                Submit your question directly to our {CLIENT_PLACEHOLDER_INFO.locationLabel} team. We
                will review your request and follow up via your phone or email.
              </p>
            </div>

            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="contact-field">
                <label htmlFor="inq-name">Your Name</label>
                <input
                  id="inq-name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  maxLength={ENQUIRY_LIMITS.name.max}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="contact-field">
                <label htmlFor="inq-contact">Phone Number or Email</label>
                <input
                  id="inq-contact"
                  type="text"
                  placeholder="Enter your phone or email"
                  value={formData.contact}
                  onChange={handleChange('contact')}
                  maxLength={ENQUIRY_LIMITS.contact.max}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="contact-field">
                <label htmlFor="inq-topic">Inquiry Category</label>
                <select
                  id="inq-topic"
                  value={formData.topic}
                  onChange={handleChange('topic')}
                  disabled={isSubmitting}
                >
                  {INQUIRY_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>

              <div className="contact-field">
                <label htmlFor="inq-message">Message</label>
                <textarea
                  id="inq-message"
                  rows={4}
                  placeholder="Tell us what helmet, riding gear, bike modification, or accessory you are inquiring about..."
                  value={formData.message}
                  onChange={handleChange('message')}
                  maxLength={ENQUIRY_LIMITS.message.max}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {errorMsg && (
                <p className="contact-form__error" role="alert">
                  {errorMsg}
                </p>
              )}

              <div className="contact-form__submit-row">
                <MagneticButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  icon={isSubmitting ? Loader2 : Send}
                  className={isSubmitting ? 'contact-form__btn--loading' : ''}
                >
                  {isSubmitting ? 'Sending Enquiry...' : 'Submit Enquiry'}
                </MagneticButton>
              </div>
            </form>

            {submittedEnquiry && (
              <div className="contact-form__success" role="status">
                <CheckCircle2 size={18} aria-hidden="true" />
                <div>
                  <strong>Enquiry Received:</strong> Thank you,{' '}
                  <span>{submittedEnquiry.name}</span>. Your{' '}
                  <span>{submittedEnquiry.topic}</span> enquiry has been saved for our{' '}
                  {CLIENT_PLACEHOLDER_INFO.locationLabel} showroom team.{' '}
                  <a
                    href={buildMailtoHref(submittedEnquiry)}
                    className="contact-form__reopen"
                  >
                    Also Send Copy via Email App <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
