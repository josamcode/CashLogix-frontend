// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        textMain: "#222",
        bgMain: "#ffffff",
      },
      fontFamily: {
        kanit: ["Kanit", "sans-serif"],
        Rubik: ["Rubik", "sans-serif"],
      },
      minHeight: {
        "screen-minus-70": "calc(100vh - 70px)",
      },
    },
  },
  plugins: [],
};
