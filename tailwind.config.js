/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
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
        text: {
          primary: "#111827",
          secondary: "#4B5563",
          muted: "#9CA3AF",
        },
      },
      backgroundImage: {
        "gradient-electric":
          "linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)",
        "gradient-scout":
          "linear-gradient(135deg, #A855F7 0%, #6366F1 100%)",
        "gradient-dark":
          "linear-gradient(180deg, #0B0E14 0%, #151922 100%)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "radar-sweep": "radarSweep 3s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 40px rgba(168, 85, 247, 0.8)",
          },
        },
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      boxShadow: {
        "glow-electric": "0 0 30px rgba(99, 102, 241, 0.3)",
        "glow-cyan": "0 0 30px rgba(6, 182, 212, 0.3)",
        "glow-scout": "0 0 30px rgba(168, 85, 247, 0.4)",
      },
    },
  },
  plugins: [],
};
