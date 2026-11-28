import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Inbox,
  MessageSquare,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  subscribeAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '../../services/notificationService';
import './AdminNotificationBell.css';

/**
 * Admin Notification Bell & Panel
 *
 * For authorized showroom admin:
 * - Real-time Firestore subscription to `adminNotifications`
 * - Displays unread counter badge
 * - Shows incoming customer enquiries (customer name, topic, snippet, timestamp)
 * - Clicking a notification navigates / filters to the corresponding enquiry
 * - Mark as read & Mark all as read
 */
export default function AdminNotificationBell({ onSelectEnquiry }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeAdminNotifications(
      (items) => {
        setNotifications(items);
      },
      (err) => {
        console.warn('Admin notifications listener notice:', err?.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkOne = async (id, e) => {
    e.stopPropagation();
    try {
      await markAdminNotificationRead(id);
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAdminNotificationsRead(notifications);
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    }
  };

  const handleSelect = async (item) => {
    if (!item.isRead) {
      await markAdminNotificationRead(item.id);
    }
    setIsOpen(false);
    if (onSelectEnquiry && item.relatedEnquiryId) {
      onSelectEnquiry(item.relatedEnquiryId);
    }
  };

  const formatTimestamp = (createdAt) => {
    if (!createdAt) return 'Recent';
    const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
    if (isNaN(date.getTime())) return 'Recent';
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="admin-notif-wrap" ref={dropdownRef}>
      <button
        type="button"
        className="admin-notif-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="View admin enquiries notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="admin-notif-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="admin-notif-dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
          >
            <div className="admin-notif-header">
              <div className="admin-notif-title-row">
                <Bell size={16} className="admin-notif-header-icon" />
                <span className="admin-notif-header-title">Enquiry Alerts</span>
                {unreadCount > 0 && (
                  <span className="admin-notif-header-unread">{unreadCount} unread</span>
                )}
              </div>
              <div className="admin-notif-header-actions">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="admin-notif-mark-all"
                    onClick={handleMarkAll}
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  className="admin-notif-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close notification panel"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="admin-notif-list">
              {notifications.length === 0 ? (
                <div className="admin-notif-empty">
                  <Inbox size={26} className="admin-notif-empty__icon" />
                  <p className="admin-notif-empty__title">No new enquiry alerts</p>
                  <p className="admin-notif-empty__sub">
                    When visitors submit enquiries via website contact, alerts will appear here in real-time.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`admin-notif-item ${!item.isRead ? 'is-unread' : ''}`}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="admin-notif-item__head">
                      <div className="admin-notif-item__badge-row">
                        <MessageSquare size={13} className="admin-notif-type-icon" />
                        <span className="admin-notif-item__title">{item.title}</span>
                      </div>
                      {!item.isRead ? (
                        <button
                          type="button"
                          className="admin-notif-item__check"
                          onClick={(e) => handleMarkOne(item.id, e)}
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      ) : (
                        <span className="admin-notif-item__read-label">Read</span>
                      )}
                    </div>

                    <div className="admin-notif-item__customer">
                      <User size={12} />
                      <span>{item.customerName}</span>
                      {item.contact && (
                        <span className="admin-notif-item__contact">({item.contact})</span>
                      )}
                    </div>

                    <p className="admin-notif-item__msg">{item.message}</p>

                    <div className="admin-notif-item__foot">
                      <Clock size={11} />
                      <span>{formatTimestamp(item.createdAt)}</span>
                      {item.relatedEnquiryId && (
                        <span className="admin-notif-item__action-hint">
                          Click to view in dashboard <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
