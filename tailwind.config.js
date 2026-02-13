/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        sora: ["Sora", "ui-sans-serif", "system-ui"],
      },
      colors: {
        xenon: {
          900: "#000033",
          400: "#3b82f6",
        },
        light: {
          50: "#FFFFFF",
          100: "#F9FAFB",
          200: "#F3F4F6",
          300: "#E5E7EB",
          400: "#D1D5DB",
        },
        midnight: {
          950: "#0B0E14",
          900: "#151922",
          800: "#1E2330",
          700: "#2A3142",
          600: "#3D4559",
        },
        electric: {
          indigo: "#6366F1",
          cyan: "#06B6D4",
        },
        scout: {
          purple: "#A855F7",
          glow: "#C084FC",
        },
        surface: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EBEBEB",
          border: "#E8E8E8",
        },
        text: {
          primary: "#212021",
          secondary: "#555555",
          muted: "#888888",
        },
      },
      borderRadius: {
        card: "8px",
        button: "8px",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "radar-sweep": "radarSweep 3s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      boxShadow: {
        "clean-sm": "0 1px 3px rgba(0,0,0,0.04)",
        clean: "0 2px 8px rgba(0,0,0,0.08)",
        "clean-md": "0 4px 16px rgba(0,0,0,0.08)",
        "clean-lg": "0 8px 24px rgba(0,0,0,0.10)",
        "clean-hover": "0 4px 12px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
