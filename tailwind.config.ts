import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        marble: "#eef1e6",
        ink: "#16221d",
        aegean: "#1f6f78",
        bronze: "#8a6a3a"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(32, 28, 23, 0.11)"
      }
    }
  },
  plugins: []
};

export default config;
