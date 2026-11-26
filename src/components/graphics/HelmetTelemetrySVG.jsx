import { motion } from 'framer-motion';
import './HelmetTelemetrySVG.css';

export default function HelmetTelemetrySVG() {
  return (
    <div className="telemetry-svg carbon-grid-bg" aria-hidden="true">
      <div className="telemetry-svg__hud">
        <span>WIND-TUNNEL SCHEMATIC // SUPERBIKE AERO</span>
        <span className="telemetry-svg__tag">BI-PLANE SPOILER</span>
      </div>
      <svg viewBox="0 0 460 230" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="flowSilver" x1="0" y1="0" x2="460" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#cfd5df" stopOpacity="0" />
            <stop offset="50%" stopColor="#cfd5df" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#cfd5df" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flowRed" x1="0" y1="0" x2="460" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e11d2a" stopOpacity="0" />
            <stop offset="45%" stopColor="#ff2e3b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e11d2a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Wind-tunnel aerodynamic streamlines */}
        <motion.path
          d="M18 102 C 110 38, 250 28, 438 66"
          stroke="url(#flowRed)"
          strokeWidth="1.8"
          strokeDasharray="10 8"
          initial={{ pathLength: 0, opacity: 0.2 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
        />
        <motion.path
          d="M12 138 C 125 76, 270 68, 446 114"
          stroke="url(#flowSilver)"
          strokeWidth="1.2"
          initial={{ pathLength: 0, opacity: 0.2 }}
          whileInView={{ pathLength: 1, opacity: 0.9 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.12, ease: 'easeOut' }}
        />
        <motion.path
          d="M36 176 C 145 154, 285 152, 428 172"
          stroke="url(#flowSilver)"
          strokeWidth="1"
          strokeDasharray="4 6"
          initial={{ pathLength: 0, opacity: 0.15 }}
          whileInView={{ pathLength: 1, opacity: 0.75 }}
          viewport={{ once: true }}
          transition={{ duration: 1.65, delay: 0.22, ease: 'easeOut' }}
        />

        {/* Rear bi-plane aero spoiler wireframe */}
        <motion.path
          d="M114 96 L154 78 L146 108 L110 112 Z"
          stroke="#ff2e3b"
          strokeWidth="1.5"
          fill="rgba(225, 29, 42, 0.12)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.45 }}
        />

        {/* Aggressive Superbike Full-Face Shell & V-Apex Chin Wireframe */}
        <motion.path
          d="M142 156 C 136 96, 174 54, 238 52 C 282 51, 316 74, 328 114 L 340 142 L 318 170 C 304 186, 276 190, 234 190 H 168 C 150 190, 144 176, 142 156 Z"
          stroke="#cfd5df"
          strokeOpacity="0.6"
          strokeWidth="1.7"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: 'easeInOut' }}
        />

        {/* Crown aero intake & racing crest */}
        <motion.path
          d="M170 72 C 202 56, 248 54, 292 68"
          stroke="#ff2e3b"
          strokeWidth="2.4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.35 }}
        />

        {/* Large dark iridium racing visor */}
        <motion.path
          d="M224 90 L 324 85 C 330 103, 328 122, 315 137 L 226 134 C 210 133, 202 122, 204 109 C 205 97, 213 91, 224 90 Z"
          fill="rgba(225, 29, 42, 0.12)"
          stroke="#ff2e3b"
          strokeWidth="1.6"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.55 }}
        />

        {/* CNC Side Visor Ratchet Pod & Chin Louvers */}
        <circle cx="212" cy="116" r="10" stroke="#cfd5df" strokeOpacity="0.65" strokeWidth="1.4" />
        <circle cx="212" cy="116" r="3.5" fill="#ff2e3b" />
        <circle cx="114" cy="96" r="3" fill="#ff2e3b" />
        <circle cx="340" cy="142" r="3" fill="#cfd5df" />
      </svg>
    </div>
  );
}
