import type { Platform } from '../types';

/**
 * Curated list of digital platforms and services tracked by the weekly survey.
 * Covers social media, shopping, streaming, rideshare, and news platforms.
 *
 * OpenSecrets org IDs are pre-populated where known; others are resolved at
 * runtime via the matching pipeline. lastVerifiedDate marks when each entry
 * was last checked against OpenSecrets data.
 *
 * This list is intentionally separate from the main entity list — the Survey
 * focuses on platforms people interact with digitally every week, while the
 * Map covers physical businesses.
 */
export const TRACKED_PLATFORMS: Platform[] = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    parentCompany: 'X Corp',
    ceoName: 'Linda Yaccarino',
    categoryTags: ['social'],
    confidenceOverride: 'HIGH',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    parentCompany: 'Meta Platforms',
    ceoName: 'Mark Zuckerberg',
    categoryTags: ['social'],
    confidenceOverride: 'HIGH',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    parentCompany: 'Meta Platforms',
    ceoName: 'Mark Zuckerberg',
    categoryTags: ['social'],
    confidenceOverride: 'HIGH',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    parentCompany: 'Amazon.com Inc',
    ceoName: 'Andy Jassy',
    categoryTags: ['shopping', 'streaming'],
    confidenceOverride: 'HIGH',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    parentCompany: 'Alphabet Inc',
    ceoName: 'Sundar Pichai',
    categoryTags: ['streaming', 'social'],
    confidenceOverride: 'HIGH',
  },
  {
    id: 'uber',
    name: 'Uber',
    parentCompany: 'Uber Technologies',
    ceoName: 'Dara Khosrowshahi',
    categoryTags: ['rideshare'],
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    parentCompany: 'DoorDash Inc',
    ceoName: 'Tony Xu',
    categoryTags: ['food-delivery'],
  },
  {
    id: 'walmart',
    name: 'Walmart.com',
    parentCompany: 'Walmart Inc',
    ceoName: 'Doug McMillon',
    categoryTags: ['shopping'],
    confidenceOverride: 'HIGH',
  },
  {
    id: 'home-depot',
    name: 'Home Depot',
    parentCompany: 'Home Depot Inc',
    ceoName: 'Ted Decker',
    categoryTags: ['shopping'],
    confidenceOverride: 'HIGH',
  },
  {
    id: 'fox-news',
    name: 'Fox News',
    parentCompany: 'Fox Corp',
    ceoName: 'Lachlan Murdoch',
    categoryTags: ['news'],
    confidenceOverride: 'HIGH',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    parentCompany: 'Reddit Inc',
    ceoName: 'Steve Huffman',
    categoryTags: ['social'],
  },
  {
    id: 'twitch',
    name: 'Twitch',
    parentCompany: 'Amazon.com Inc',
    ceoName: 'Andy Jassy',
    categoryTags: ['streaming'],
    confidenceOverride: 'HIGH',
  },
];
