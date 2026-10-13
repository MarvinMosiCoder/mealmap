/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0C7762",
        background: "#F3F8F5",
        surface: "#FFFFFF",
        text: "#173B35",
        muted: "#6D8580",
        border: "#E4EEEA",
        pink: "#F28BA5",
        mint: "#9CDED2",
        butter: "#F8DF79",
      },
      spacing: {
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-semibold": ["Poppins_600SemiBold"],
        "poppins-bold": ["Poppins_700Bold"],
        "poppins-extrabold": ["Poppins_800ExtraBold"],
      },
    },
  },
  plugins: [],
};
