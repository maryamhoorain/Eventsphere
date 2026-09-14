import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './SplashScreen.css';

const SPLASH_KEY = 'eventsphere-splash-seen';

export default function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(SPLASH_KEY) !== 'true';
    } catch {
      return true;
    }
  });
  const rootRef = useRef(null);
  const logoRef = useRef(null);
  const wordRefs = useRef([]);

  useEffect(() => {
    if (!visible) return undefined;
    const root = rootRef.current;
    const logo = logoRef.current;
    if (!root || !logo) return undefined;

    const finish = () => {
      try { sessionStorage.setItem(SPLASH_KEY, 'true'); } catch { /* storage may be unavailable */ }
      setVisible(false);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = window.setTimeout(finish, 450);
      return () => window.clearTimeout(timer);
    }

    const target = document.querySelector('.navbar__logo');
    const targetRect = target?.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();
    const destination = targetRect
      ? {
        x: targetRect.left + targetRect.width / 2 - (logoRect.left + logoRect.width / 2),
        y: targetRect.top + targetRect.height / 2 - (logoRect.top + logoRect.height / 2),
        scale: targetRect.width / logoRect.width,
      }
      : { x: -window.innerWidth / 2 + 42, y: -window.innerHeight / 2 + 42, scale: 0.52 };

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: finish });
      timeline
        .fromTo(root, { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.15 })
        .fromTo(wordRefs.current, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.08, ease: 'power3.out' }, 0.15)
        .to(logo, { x: destination.x, y: destination.y, scale: destination.scale, duration: 0.9, ease: 'power3.inOut' }, 0.85)
        .to(wordRefs.current, { autoAlpha: 0, y: -15, duration: 0.25, stagger: 0.03, ease: 'power2.in' }, 1.35)
        .to(root, { autoAlpha: 0, duration: 0.35, ease: 'power2.inOut' }, 1.5);
    }, root);

    return () => ctx.revert();
  }, [visible]);

  if (!visible) return null;
  return (
    <div ref={rootRef} className="splash-screen" role="status" aria-label="Loading EventSphere">
      <div className="splash-screen__glow" />
      <div className="splash-screen__content">
        <div className="splash-screen__logo-wrap">
          <img ref={logoRef} src="/logo.jpg" alt="" className="splash-screen__logo" />
        </div>
        <div className="splash-screen__wordmark" aria-hidden="true">
          {['Event', 'Sphere'].map((word, index) => (
            <span
              key={word}
              ref={(element) => { wordRefs.current[index] = element; }}
              className={index === 0 ? 'splash-screen__accent' : ''}
            >
              {word}
            </span>
          ))}
        </div>
        <p>Where every gathering becomes an experience</p>
      </div>
    </div>
  );
}
