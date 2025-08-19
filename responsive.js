// responsive.js - Responsive design utilities

import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
export const responsive = {
  // Screen width breakpoints
  isSmallScreen: width < 375,
  isMediumScreen: width >= 375 && width < 768,
  isLargeScreen: width >= 768,
  
  // Device type detection
  isTablet: width >= 768,
  isPhone: width < 768,
  
  // Platform detection
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  
  // Responsive font sizes
  fontSize: {
    small: Math.min(12, width * 0.035),
    medium: Math.min(14, width * 0.04),
    large: Math.min(16, width * 0.045),
    xlarge: Math.min(18, width * 0.05),
  },
  
  // Responsive spacing
  spacing: {
    xs: width * 0.01,
    sm: width * 0.02,
    md: width * 0.03,
    lg: width * 0.04,
    xl: width * 0.05,
  },
  
  // Responsive dimensions
  width: width,
  height: height,
  
  // Percentage helpers
  wp: (percentage) => (width * percentage) / 100,
  hp: (percentage) => (height * percentage) / 100,
};

// Responsive styles helper
export const responsiveStyles = {
  container: {
    flex: 1,
    paddingHorizontal: responsive.spacing.md,
    paddingVertical: responsive.spacing.sm,
  },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: responsive.isPhone ? 8 : 12,
    padding: responsive.spacing.md,
    marginVertical: responsive.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  button: {
    paddingVertical: responsive.isPhone ? 12 : 16,
    paddingHorizontal: responsive.isPhone ? 16 : 24,
    borderRadius: responsive.isPhone ? 6 : 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  text: {
    fontSize: responsive.fontSize.medium,
    lineHeight: responsive.fontSize.medium * 1.4,
  },
};

// Responsive grid layout
export const Grid = {
  container: {
    flexDirection: responsive.isPhone ? 'column' : 'row',
    flexWrap: responsive.isPhone ? 'nowrap' : 'wrap',
  },
  
  item: {
    width: responsive.isPhone ? '100%' : '48%',
    marginBottom: responsive.spacing.md,
  },
};

// Responsive table styles
export const TableStyles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  scrollContainer: {
    flexGrow: 1,
  },
  
  table: {
    minWidth: responsive.isPhone ? 600 : '100%',
  },
  
  row: {
    flexDirection: 'row',
    paddingVertical: responsive.spacing.sm,
    paddingHorizontal: responsive.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  cell: {
    paddingHorizontal: responsive.spacing.sm,
    fontSize: responsive.isPhone ? 12 : 14,
    textAlign: 'center',
    flex: 1,
  },
  
  headerCell: {
    fontWeight: 'bold',
    fontSize: responsive.isPhone ? 12 : 14,
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
};
