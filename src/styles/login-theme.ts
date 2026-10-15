export const loginThemes = {
  light: {
    background: "#F3F8F5",
    surface: "#FFFFFF",
    text: "#173B35",
    muted: "#6D8580",
    border: "#E4EEEA",
    primary: "#0C7762",
    onPrimary: "#FFFFFF",
    accent: "#0C7762",
    error: "#B91C1C",
  },
  dark: {
    background: "#10231E",
    surface: "#19362D",
    text: "#F3F8F5",
    muted: "#A4BDB2",
    border: "#305145",
    primary: "#86D6B5",
    onPrimary: "#10231E",
    accent: "#86D6B5",
    error: "#FDA4AF",
  },
};

export type LoginTheme = typeof loginThemes.light;
