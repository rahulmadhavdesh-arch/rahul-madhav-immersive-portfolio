/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Anybody"', "system-ui", "sans-serif"],
        body: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        mono: ['"Martian Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: { DEFAULT: "#07070c", 2: "#0e0f17", 3: "#161723" },
        accent: "var(--accent)",
        aqua: "#4be1ff",
        coral: "#ff6b57",
        violet: "#8f7bff",
        lime: "#c9ff4a",
        butter: "#ffd84a",
        text: { DEFAULT: "#f3f2f7", 2: "#b4b3c2", 3: "#7c7b8c" },
        cyan: { DEFAULT: "#4be1ff" },
        gold: "#ffd84a",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
