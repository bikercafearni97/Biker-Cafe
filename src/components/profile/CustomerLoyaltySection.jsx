import { useState, useEffect } from 'react';
import {
  Award,
  Gift,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  getUserLoyalty,
  redeemLoyaltyPoints,
  LOYALTY_TIERS,
} from '../../services/loyaltyService';
import './CustomerLoyaltySection.css';

export default function CustomerLoyaltySection({ user }) {
  const [loyalty, setLoyalty] = useState({
    balance: 0,
    tier: LOYALTY_TIERS.ROOKIE,
    history: [],
  });
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [voucherSuccess, setVoucherSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchLoyalty() {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const data = await getUserLoyalty(user.uid);
        if (!cancelled) setLoyalty(data);
      } catch (err) {
        console.warn('Error fetching loyalty:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLoyalty();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleRedeem = async (points) => {
    setErrorMsg('');
    setVoucherSuccess(null);
    setRedeeming(true);
    try {
      const result = await redeemLoyaltyPoints(user.uid, points);
      setVoucherSuccess(result);
      // Refresh loyalty state
      const updated = await getUserLoyalty(user.uid);
      setLoyalty(updated);
    } catch (err) {
      setErrorMsg(err.message || 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-state-card">
        <Loader2 size={20} className="admin-spin" />
        <p>Calculating rider loyalty tier &amp; points...</p>
      </div>
    );
  }

  const redemptionOptions = [
    { points: 50, value: 100, label: '₹100 Off Voucher' },
    { points: 100, value: 200, label: '₹200 Off Voucher' },
    { points: 250, value: 500, label: '₹500 Off Showroom Voucher' },
  ];

  return (
    <div className="loyalty-section">
      <div className="loyalty-card-overview">
        <div className="loyalty-balance-block">
          <span className="eyebrow">RIDER REWARD BALANCE</span>
          <strong>{loyalty.balance} PTS</strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--silver-muted)', marginTop: '0.25rem', display: 'block' }}>
            Earn 1 Point for every ₹100 spent on delivered gear orders
          </span>
        </div>

        <div>
          <div
            className="loyalty-tier-badge"
            style={{ color: loyalty.tier.badgeColor, borderColor: loyalty.tier.badgeColor }}
          >
            <Award size={14} />
            <span>{loyalty.tier.name.toUpperCase()}</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--silver-dim)', margin: '0.4rem 0 0', maxWidth: '280px' }}>
            {loyalty.tier.perk}
          </p>
        </div>
      </div>

      {voucherSuccess && (
        <div className="admin-alert admin-alert--success" role="alert">
          <CheckCircle2 size={16} />
          <div>
            <strong>Voucher Generated: {voucherSuccess.voucherCode}</strong>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
              ₹{voucherSuccess.voucherValue} discount has been saved! You can apply this code during checkout.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="admin-alert admin-alert--error" role="alert">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Point Redemption Options */}
      <div>
        <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--silver-bright)', marginBottom: '0.75rem' }}>
          Redeem Points for Checkout Discounts
        </h4>
        <div className="loyalty-redemption-grid">
          {redemptionOptions.map((opt) => {
            const canAfford = loyalty.balance >= opt.points;
            return (
              <div key={opt.points} className="loyalty-reward-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--red-bright)', fontWeight: 'bold' }}>
                    {opt.points} Points
                  </span>
                  <Gift size={16} style={{ color: 'var(--silver-dim)' }} />
                </div>
                <div>
                  <strong style={{ color: 'var(--silver-bright)', fontSize: '0.95rem' }}>{opt.label}</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--silver-muted)' }}>
                    Applicable on all helmets &amp; gear
                  </p>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--primary"
                    disabled={!canAfford || redeeming}
                    onClick={() => handleRedeem(opt.points)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {canAfford ? 'Redeem Voucher' : `Need ${opt.points - loyalty.balance} more pts`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Points History Ledger */}
      {loyalty.history.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--silver-bright)', marginBottom: '0.5rem' }}>
            Points History &amp; Audit Trail
          </h4>
          <table className="loyalty-history-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Points</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loyalty.history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span
                      style={{
                        color: item.points > 0 ? 'var(--green-bright, #22c55e)' : 'var(--red-bright)',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                      }}
                    >
                      {item.type?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {item.points > 0 ? `+${item.points}` : item.points}
                  </td>
                  <td>{item.description}</td>
                  <td>
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
