import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { LiquidBackground } from '../effects/LiquidBackground';
import LightPillar from '../effects/LightPillar';
import { AssistantWidget } from '../common/AssistantWidget';

// Single, page-wide LiquidEther layer. It's fixed to the viewport (not tied
// to any one section) so it sits behind the navbar, every section, and the
// footer as one continuous background instead of being re-mounted per
// section. Individual sections/pages should NOT render their own
// <LiquidBackground> anymore — this is the only instance.
export function PublicLayout({ children }) {
  return (
    <div className="public-shell">
      <div className="site-bg" />
      <LiquidBackground opacity={0.35} style={{ position: 'fixed' }} />
      <LightPillar className="site-light-pillar" topColor="#2563eb" bottomColor="#38bdf8" intensity={0.28} glowAmount={0.003} rotationSpeed={0.12} quality="low" />
      <div className="public-content">
        <Navbar />
        {children}
        <Footer />
        <AssistantWidget />
      </div>
    </div>
  );
}
