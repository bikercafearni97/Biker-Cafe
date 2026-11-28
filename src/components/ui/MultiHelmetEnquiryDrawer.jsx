import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Send, Trash2, X } from 'lucide-react';
import { useSmartEnquiry } from '../../context/SmartEnquiryContext';
import WhatsAppIcon from '../ui/WhatsAppIcon';
import './MultiHelmetEnquiryDrawer.css';

export default function MultiHelmetEnquiryDrawer({ isOpen, onClose }) {
  const { enquiryItems, removeHelmetFromEnquiry, clearEnquiry, generateMultiWhatsAppUrl } =
    useSmartEnquiry();
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const waUrl = generateMultiWhatsAppUrl(customerName, notes);

  const drawerContent = (
    <div
      className="multi-enquiry-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="multi-enquiry-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="multi-enquiry-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="multi-enquiry-drawer__header">
          <div className="multi-enquiry-drawer__title-wrap">
            <MessageSquare size={20} className="multi-enquiry-drawer__icon" aria-hidden="true" />
            <h2 id="multi-enquiry-title">Smart WhatsApp Enquiry</h2>
          </div>
          <button
            type="button"
            className="multi-enquiry-drawer__close"
            onClick={onClose}
            aria-label="Close enquiry list"
          >
            <X size={20} />
          </button>
        </div>

        <p className="multi-enquiry-drawer__intro">
          Combine multiple AXOR helmets into one verified enquiry message directly to the BIKER
          CAFE Arni showroom WhatsApp.
        </p>

        {enquiryItems.length === 0 ? (
          <div className="multi-enquiry-empty">
            <p>Your enquiry list is currently empty.</p>
            <span>Tap &ldquo;+ Add to Enquiry List&rdquo; on any helmet page or card to compile multiple models.</span>
          </div>
        ) : (
          <>
            <div className="multi-enquiry-items">
              {enquiryItems.map((item) => (
                <div key={item.id} className="multi-enquiry-item">
                  <div className="multi-enquiry-item__info">
                    <strong>{item.title}</strong>
                    <span>
                      Size: {item.size || 'M'} · {item.priceLabel || 'Reference MRP'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="multi-enquiry-item__remove"
                    onClick={() => removeHelmetFromEnquiry(item.id)}
                    aria-label={`Remove ${item.title} from enquiry list`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="multi-enquiry-form">
              <div className="multi-enquiry-field">
                <label htmlFor="enquiry-cust-name">Your Name (Optional)</label>
                <input
                  id="enquiry-cust-name"
                  type="text"
                  placeholder="e.g. Arun Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="multi-enquiry-field">
                <label htmlFor="enquiry-cust-notes">Additional Questions (Optional)</label>
                <input
                  id="enquiry-cust-notes"
                  type="text"
                  placeholder="e.g. Inquiring about Matte finish availability in size L"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="multi-enquiry-actions">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="multi-enquiry-send-btn"
                onClick={onClose}
              >
                <WhatsAppIcon size={18} />
                <span>Send WhatsApp Enquiry ({enquiryItems.length} Helmets)</span>
                <Send size={15} />
              </a>

              <button
                type="button"
                className="multi-enquiry-clear-btn"
                onClick={clearEnquiry}
              >
                Clear List
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : drawerContent;
}
