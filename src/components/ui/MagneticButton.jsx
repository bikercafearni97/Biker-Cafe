import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './MagneticButton.css';

const MotionLink = motion.create(Link);

export default function MagneticButton({
  children,
  variant = 'primary',
  onClick,
  href,
  target,
  rel,
  to,
  type = 'button',
  disabled = false,
  className = '',
  icon: Icon,
  ariaLabel,
}) {
  const classes = `mag-btn mag-btn--${variant} ${className}`;

  const content = (
    <>
      <span className="mag-btn__sheen" aria-hidden="true" />
      <span className="mag-btn__label">{children}</span>
      {Icon && <Icon className="mag-btn__icon" size={16} strokeWidth={2} aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <MotionLink
        to={to}
        className={classes}
        aria-label={ariaLabel}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      >
        {content}
      </MotionLink>
    );
  }

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        className={classes}
        aria-label={ariaLabel}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      {content}
    </motion.button>
  );
}
