import type { ReactElement } from 'react';

/**
 * Effect scopes:
 *   point — anchored to a coordinate/position (future: map pin celebrations)
 *   area  — positioned within a region (future: card-area effects)
 *   full  — covers the entire screen
 */
export type FXScope = 'point' | 'area' | 'full';

/** A single active effect instance. */
export interface FXEntry {
  id: string;
  type: string;
  scope: FXScope;
  startedAt: number;
  /** Arbitrary payload for the effect renderer. */
  meta?: Record<string, unknown>;
}

/** Props passed to every registered effect component. */
export interface FXComponentProps {
  entry: FXEntry;
  reducedMotion: boolean;
  onComplete: () => void;
}

/** A registered effect type — maps a type key to a renderer. */
export interface FXRegistration {
  scope: FXScope;
  component: (props: FXComponentProps) => ReactElement | null;
}
