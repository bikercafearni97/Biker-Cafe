import './PlaceholderBadge.css';

export default function PlaceholderBadge({ children = 'Placeholder' }) {
  return (
    <span className="ph-badge" title="Temporary placeholder pending client information">
      <span className="ph-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
