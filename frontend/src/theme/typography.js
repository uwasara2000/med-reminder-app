export const getTypography = (isSeniorMode = true) => {
  if (isSeniorMode) {
    return {
      // Extra large, bold, high legibility for senior users
      header: {
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 34,
        letterSpacing: 0.2
      },
      title: {
        fontSize: 22,
        fontWeight: '700',
        lineHeight: 28
      },
      timeDisplay: {
        fontSize: 26,
        fontWeight: '900',
        lineHeight: 32
      },
      bodyLarge: {
        fontSize: 19,
        fontWeight: '600',
        lineHeight: 26
      },
      bodyMedium: {
        fontSize: 17,
        fontWeight: '500',
        lineHeight: 24
      },
      bodySmall: {
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 20
      },
      buttonText: {
        fontSize: 18,
        fontWeight: '700'
      },
      minTouchHeight: 56 // Minimum accessible touch target height in pixels
    };
  }

  // Standard mode
  return {
    header: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 30
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24
    },
    timeDisplay: {
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 26
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600'
    },
    minTouchHeight: 48
  };
};
