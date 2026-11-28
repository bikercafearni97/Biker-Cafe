import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Clock, MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  subscribeCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} from '../../services/notificationService';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import './CustomerNotificationBell.css';

/**
 * Customer Notification Bell & Interactive Dropdown Panel
 *
 * For logged-in riders:
 * - Real-time Firestore subscription to `users/{userId}/notifications`
 * - Unread count badge
 * - Dropdown panel with notifications list (title, message, timestamp, enquiry link)
 * - Individual "mark as read" button
 * - "Mark all as read" button
 * - Clean zero/empty state with premium styling
 */
export default function CustomerNotificationBell() {
  const { user, loading, isAdmin } = useCustomerAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Attach listener ONLY when authentication is complete, user exists, and user is NOT the admin
  useEffect(() => {
    // If auth is still loading, user is a guest, or user is the owner/admin: do NOT attach listener
    if (loading || !user || !user.uid || isAdmin) {
      return () => {};
    }

    const unsubscribe = subscribeCustomerNotifications(
      user.uid,
      (items) => {
        setNotifications(items);
      },
      (err) => {
        console.warn('Customer notifications listener notice:', err?.message);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, loading, isAdmin]);

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

  // Do not render anything for guests, during loading, or for the admin
  if (loading || !user || isAdmin) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkOne = async (id, e) => {
    e.stopPropagation();
    try {
      await markCustomerNotificationRead(user.uid, id);
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllCustomerNotificationsRead(user.uid, notifications);
    } catch (err) {
      console.warn('Failed to mark all read:', err);
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
    <div className="cust-notif-wrap" ref={dropdownRef}>
      <button
        type="button"
        className="cust-notif-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="cust-notif-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="cust-notif-dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
          >
            <div className="cust-notif-header">
              <div className="cust-notif-title-row">
                <Bell size={16} className="cust-notif-header-icon" />
                <span className="cust-notif-header-title">Notifications</span>
                {unreadCount > 0 && (
                  <span className="cust-notif-header-unread">{unreadCount} new</span>
                )}
              </div>
              <div className="cust-notif-header-actions">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="cust-notif-mark-all"
                    onClick={handleMarkAll}
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  className="cust-notif-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close notification panel"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="cust-notif-list">
              {notifications.length === 0 ? (
                <div className="cust-notif-empty">
                  <Bell size={26} className="cust-notif-empty__icon" />
                  <p className="cust-notif-empty__title">No notifications yet</p>
                  <p className="cust-notif-empty__sub">
                    When the BIKER CAFE team responds to your enquiries, updates will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`cust-notif-item ${!item.isRead ? 'is-unread' : ''}`}
                    onClick={() => !item.isRead && handleMarkOne(item.id, { stopPropagation: () => {} })}
                  >
                    <div className="cust-notif-item__head">
                      <div className="cust-notif-item__badge-row">
                        <MessageSquare size={13} className="cust-notif-type-icon" />
                        <span className="cust-notif-item__title">{item.title}</span>
                      </div>
                      {!item.isRead ? (
                        <button
                          type="button"
                          className="cust-notif-item__check"
                          onClick={(e) => handleMarkOne(item.id, e)}
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      ) : (
                        <span className="cust-notif-item__read-label">Read</span>
                      )}
                    </div>

                    <p className="cust-notif-item__msg">{item.message}</p>

                    {item.adminNotes && (
                      <div className="cust-notif-item__notes">
                        <strong>Showroom note:</strong> {item.adminNotes}
                      </div>
                    )}

                    <div className="cust-notif-item__foot">
                      <Clock size={11} />
                      <span>{formatTimestamp(item.createdAt)}</span>
                      {item.relatedEnquiryId && (
                        <span className="cust-notif-item__ref">
                          Enquiry #{item.relatedEnquiryId.slice(0, 6)}
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
