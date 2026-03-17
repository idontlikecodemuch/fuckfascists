import type { Platform } from '../types';

/**
 * Curated list of digital platforms tracked by the avoidance screen.
 * Covers social media, shopping, streaming, and messaging platforms.
 *
 * This list is intentionally separate from the main entity list — the
 * Platforms screen focuses on services people interact with digitally
 * every day, while the Map covers physical businesses.
 */
export const TRACKED_PLATFORMS: Platform[] = [
  {
    id: 'twitter',
    name: 'X / Twitter',
    parentCompany: 'X Corp',
    ceoName: 'Linda Yaccarino',
    publicFigureName: 'Elon Musk',
    categoryTags: ['social'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    parentCompany: 'Meta Platforms',
    ceoName: 'Mark Zuckerberg',
    categoryTags: ['social'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    parentCompany: 'Meta Platforms',
    ceoName: 'Mark Zuckerberg',
    categoryTags: ['social'],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    parentCompany: 'Amazon.com Inc',
    ceoName: 'Andy Jassy',
    publicFigureName: 'Jeff Bezos',
    categoryTags: ['shopping', 'streaming'],
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime',
    parentCompany: 'Amazon.com Inc',
    ceoName: 'Andy Jassy',
    publicFigureName: 'Jeff Bezos',
    categoryTags: ['streaming', 'shopping'],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    parentCompany: 'Alphabet Inc',
    ceoName: 'Sundar Pichai',
    categoryTags: ['streaming', 'social'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    parentCompany: 'Meta Platforms',
    ceoName: 'Mark Zuckerberg',
    categoryTags: ['messaging'],
  },
  {
    id: 'threads',
    name: 'Threads',
    parentCompany: 'Meta Platforms',
    ceoName: 'Mark Zuckerberg',
    categoryTags: ['social'],
  },
];
