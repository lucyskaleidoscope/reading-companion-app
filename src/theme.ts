// Reading Companion Theme - Greek Education Style
// Based on every.to aesthetic with neo-classical education motifs

export const colors = {
  // Primary Colors
  primary: '#1E3A8A',        // Deep Aegean Blue - headers and accents
  primaryLight: '#3B5998',   // Lighter blue for hover states
  
  // Background Colors  
  background: '#F8F1E9',     // Warm Parchment Cream - main background
  backgroundDark: '#EDE4D8', // Slightly darker parchment
  card: '#F9FAFB',           // Soft Marble White - cards
  cardHover: '#FFFFFF',      // Pure white for hover
  
  // Accent Colors
  accent: '#D4AF37',         // Burnished Gold - highlights and icons
  accentDark: '#B8962E',     // Darker gold for hover
  accentLight: '#E5C75E',    // Lighter gold
  
  // Text Colors
  text: '#2D2D2D',           // Charcoal Gray - body text
  textLight: '#5A5A5A',      // Lighter text for secondary info
  textMuted: '#8A8A8A',      // Muted text
  textOnPrimary: '#F8F1E9',  // Light text on dark backgrounds
  textOnAccent: '#2D2D2D',   // Dark text on gold
  
  // Status Colors
  success: '#3D7C47',        // Muted forest green
  warning: '#C4922E',        // Warm amber
  error: '#A63D3D',          // Muted red
  
  // Border Colors
  border: '#D9D0C3',         // Warm border
  borderLight: '#E8E0D4',    // Light border
  
  // Shadow
  shadowColor: 'rgba(0,0,0,0.08)',
};

export const fonts = {
  // Using system fonts that approximate the style guide
  // Playfair Display for headings, Inter for body
  heading: 'Georgia',        // Serif fallback for Playfair Display
  body: 'System',            // System font (similar to Inter)
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
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Common style patterns
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  heading1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  bodyText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textOnAccent,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
};

export default {
  colors,
  fonts,
  spacing,
  borderRadius,
  shadows,
  commonStyles,
};
