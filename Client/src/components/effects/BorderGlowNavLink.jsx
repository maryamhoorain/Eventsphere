import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import BorderGlow from './BorderGlow';
import './BorderGlowNavLink.css';

// Brand-matched glow palette (see index.css :root --secondary / --accent / --navy)
const NAV_GLOW_COLORS = ['#2563eb', '#38bdf8', '#0f172a'];
const NAV_GLOW_HSL = '199 89% 60%'; // matches --accent (#38bdf8)

/**
 * Wraps a React Router <Link> with the React Bits BorderGlow effect and
 * plays its glow sweep as click feedback.
 *
 * Route changes here fully unmount/remount the Navbar (each page's own
 * <PublicLayout> renders a fresh one), so a click handler alone would
 * usually never get to play its animation — the old page (and its
 * click-triggered state) is torn down in the same render pass that the
 * navigation happens in. To give reliable feedback we trigger the sweep
 * two ways:
 *  1. `isActive` seeds the initial state — when the freshly-mounted page's
 *     Navbar renders, the link matching the new route starts already
 *     "triggered", so its BorderGlow plays its mount animation right as
 *     the destination page appears.
 *  2. A click handler still bumps a pulse counter for same-page clicks
 *     (e.g. clicking the already-active link), where no remount happens.
 * Either way, react-router's own <Link> navigation is untouched and fires
 * exactly as before — this only adds a visual layer on top of it, so
 * navigation is never delayed.
 */
export function BorderGlowNavLink({ to, isActive = false, onClick, className = '', linkStyle, children }) {
  const [pulse, setPulse] = useState(() => (isActive ? 1 : 0));

  const handleClick = useCallback(
    (e) => {
      setPulse((p) => p + 1);
      if (onClick) onClick(e);
    },
    [onClick]
  );

  return (
    <BorderGlow
      key={pulse}
      animated={pulse > 0}
      className="nav-borderglow"
      backgroundColor="transparent"
      borderRadius={10}
      glowRadius={10}
      glowIntensity={1.15}
      edgeSensitivity={35}
      coneSpread={32}
      fillOpacity={0.3}
      glowColor={NAV_GLOW_HSL}
      colors={NAV_GLOW_COLORS}
    >
      <Link to={to} onClick={handleClick} className={className} style={linkStyle}>
        {children}
      </Link>
    </BorderGlow>
  );
}

export default BorderGlowNavLink;
