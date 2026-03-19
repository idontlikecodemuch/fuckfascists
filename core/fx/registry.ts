import type { FXRegistration } from './types';
import { AvoidCelebration } from './effects/AvoidCelebration';

/**
 * Default effect registry.
 * Adding a new effect = adding one entry here + one component file.
 * No changes to FXLayer or useFX needed.
 */
export const defaultFXRegistry: Record<string, FXRegistration> = {
  avoid: { scope: 'full', component: AvoidCelebration },
};
