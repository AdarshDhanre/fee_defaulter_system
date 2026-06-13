/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // Dark background
        primary: "#8b5cf6", // Purple
        secondary: "#3b82f6", // Blue
        accent: "#f43f5e", // Rose/pink
        cardBg: "rgba(30, 41, 59, 0.7)",
      },
      fontFamily: {
        outfit: ["var(--font-outfit)", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
