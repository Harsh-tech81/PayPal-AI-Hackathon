import type { Config } from "tailwindcss";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: Config = {
  darkMode: "class",
  content: [
    path.join(__dirname, "src/**/*.{js,ts,jsx,tsx,mdx}").replace(/\\/g, "/"),
    path.join(__dirname, "src/pages/**/*.{js,ts,jsx,tsx,mdx}").replace(/\\/g, "/"),
    path.join(__dirname, "src/components/**/*.{js,ts,jsx,tsx,mdx}").replace(/\\/g, "/"),
    path.join(__dirname, "src/app/**/*.{js,ts,jsx,tsx,mdx}").replace(/\\/g, "/"),
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./web-app/src/**/*.{js,ts,jsx,tsx,mdx}",
    "./web-app/src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./web-app/src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./web-app/src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        paypal: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc7fb",
          400: "#36aaf6",
          500: "#0070ba",
          600: "#005ea6",
          700: "#004b87",
          800: "#003087",
          900: "#00205b",
          950: "#001238",
        },
        navy: {
          800: "#0a1329",
          850: "#070e20",
          900: "#050b18",
          950: "#03060f",
        },
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(0, 112, 186, 0.25)",
        "glow-md": "0 0 25px -4px rgba(0, 112, 186, 0.35)",
        "glow-lg": "0 0 40px -6px rgba(0, 112, 186, 0.45)",
        "glow-cyan": "0 0 30px -4px rgba(6, 182, 212, 0.4)",
        "glow-emerald": "0 0 30px -4px rgba(16, 185, 129, 0.35)",
        "glow-rose": "0 0 30px -4px rgba(244, 63, 94, 0.4)",
        "inner-glow": "inset 0 0 20px 0 rgba(0, 112, 186, 0.15)",
        "luxury": "0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 10px 20px -5px rgba(0, 0, 0, 0.04)",
        "luxury-dark": "0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 10px 30px -10px rgba(0, 112, 186, 0.15)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        scanline: "scanline 2.5s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "radar-sweep": "radarSweep 4s linear infinite",
        "fade-in": "fadeIn 0.4s ease-out forwards",
      },
      backgroundImage: {
        "radial-gradient": "radial-gradient(circle at center, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;