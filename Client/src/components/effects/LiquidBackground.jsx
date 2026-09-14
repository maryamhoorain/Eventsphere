import { ClientOnly } from './ClientOnly';
import LiquidEther from './LiquidEther';

/**
 * Shared LiquidEther background layer used across the site's dark public
 * sections (Hero, Statistics, Footer). Centralizes the effect's tuning so
 * each section only needs to opt in with an opacity, instead of repeating
 * the full prop list.
 *
 * Renders as an absolutely-positioned, non-interactive layer — the parent
 * section must be `position: relative` (and usually `overflow: hidden`),
 * and section content must sit in a sibling with `position: relative` /
 * `zIndex: 1` so it stacks above this layer.
 */
export function LiquidBackground({ opacity = 0.55, colors = ['#2563EB', '#38BDF8', '#172554'], style, ...overrides }) {
  return (
    <ClientOnly>
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity, ...style }}
        aria-hidden="true"
      >
        <LiquidEther
          colors={colors}
          mouseForce={14}
          cursorSize={90}
          resolution={0.4}
          isViscous={false}
          iterationsViscous={16}
          iterationsPoisson={16}
          autoDemo
          autoSpeed={0.35}
          autoIntensity={1.6}
          takeoverDuration={0.3}
          autoResumeDelay={2500}
          autoRampDuration={0.6}
          backgroundColor="#070b16"
          lightMode={false}
          {...overrides}
        />
      </div>
    </ClientOnly>
  );
}
