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
        marble: "#f4f1ea",
        ink: "#201c17",
        laurel: "#586645",
        clay: "#9c6044"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(32, 28, 23, 0.11)"
      }
    }
  },
  plugins: []
};

export default config;
