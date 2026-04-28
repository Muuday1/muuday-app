/**
 * Shared design tokens for Muuday mobile app.
 * Mirrors the web design system for consistency.
 */
export const tokens = {
  colors: {
    primary: '#9FE870',
    primaryDark: '#8ed85f',
    primaryLight: '#b5f08f',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    heading1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
    heading2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 30 },
    heading3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  },
}

export type Tokens = typeof tokens
