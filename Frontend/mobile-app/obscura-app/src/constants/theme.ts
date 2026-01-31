/**
 * Obscura Design System
 * Color palette: #000000, #52057B, #892CDC, #BC6FF1
 */

export const colors = {
  // Background colors
  background: {
    primary: '#000000',
    secondary: '#0A0A0F',
    tertiary: '#121218',
    card: '#0D0D12',
  },
  
  // Brand colors - Updated palette
  brand: {
    primary: '#892CDC',      // Main Purple
    secondary: '#52057B',    // Dark Purple
    accent: '#BC6FF1',       // Light Purple/Pink
    dark: '#52057B',
    gradient: ['#52057B', '#892CDC', '#BC6FF1'],
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1AA',
    muted: '#71717A',
    accent: '#BC6FF1',
  },
  
  // Status colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#892CDC',
  },
  
  // Border colors
  border: {
    default: '#1A1A24',
    focus: '#892CDC',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
};

// Gradient presets
export const gradients = {
  primary: ['#52057B', '#892CDC'] as const,
  secondary: ['#892CDC', '#BC6FF1'] as const,
  accent: ['#52057B', '#892CDC', '#BC6FF1'] as const,
};

export default { colors, spacing, borderRadius, typography, gradients };
