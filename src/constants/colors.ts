// ============================================================================
// SafeDrive — Design System Colors
// ============================================================================

export const Colors = {
  // Background layers
  background: '#0A0E1A',
  surface: '#141926',
  surfaceLight: '#1E2438',
  surfaceElevated: '#252B3D',

  // Primary palette
  primary: '#6C63FF',
  primaryLight: '#8B83FF',
  primaryDark: '#4A42E0',

  // Accent
  accent: '#00D9FF',
  accentLight: '#33E1FF',
  accentDark: '#00B8D9',

  // Semantic colors
  success: '#00E676',
  successDark: '#00C853',
  warning: '#FFB300',
  warningDark: '#FF8F00',
  danger: '#FF5252',
  dangerDark: '#FF1744',
  info: '#448AFF',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8E95A9',
  textTertiary: '#5A6178',
  textInverse: '#0A0E1A',

  // Borders
  border: '#2A3148',
  borderLight: '#353D55',

  // Gradients (used as array pairs)
  gradientPrimary: ['#6C63FF', '#00D9FF'] as [string, string],
  gradientDanger: ['#FF5252', '#FF1744'] as [string, string],
  gradientSuccess: ['#00E676', '#00C853'] as [string, string],
  gradientDark: ['#141926', '#0A0E1A'] as [string, string],

  // Safety rating colors
  ratingExcellent: '#00E676',
  ratingGood: '#448AFF',
  ratingFair: '#FFB300',
  ratingPoor: '#FF7043',
  ratingDangerous: '#FF1744',

  // Shadows
  shadowColor: '#000000',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

/**
 * Get the color for a safety rating.
 */
export function getRatingColor(rating: string): string {
  switch (rating) {
    case 'Excellent': return Colors.ratingExcellent;
    case 'Good': return Colors.ratingGood;
    case 'Fair': return Colors.ratingFair;
    case 'Poor': return Colors.ratingPoor;
    case 'Dangerous': return Colors.ratingDangerous;
    default: return Colors.textSecondary;
  }
}

/**
 * Get the color for a score value.
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return Colors.ratingExcellent;
  if (score >= 75) return Colors.ratingGood;
  if (score >= 60) return Colors.ratingFair;
  if (score >= 40) return Colors.ratingPoor;
  return Colors.ratingDangerous;
}
