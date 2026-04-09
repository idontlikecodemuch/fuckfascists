import type { FXRegistration } from './types';

/**
 * Default effect registry.
 * Adding a new effect = adding one entry here + one component file.
 * No changes to FXLayer or useFX needed.
 *
 * The avoid celebration (formerly AvoidCelebration full-screen checkmark)
 * is now handled by card-local animations in BusinessCard (StampOverlay,
 * MoneyParticles, screen shake) and MapScreen (amber pulse overlay).
 */
export const defaultFXRegistry: Record<string, FXRegistration> = {};
