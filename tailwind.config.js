export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // <-- include js and jsx
  ],
  theme: {
    extend: {
      // If you use custom color tokens like marblewhite/marbleblack/backnews*,
      // define them here (match your old palette).
      colors: {
        marblewhite: "#ffffff",
        marbleblack: "#0b0b0b",
        backnewswhite: "#ec8b0b",
        backnewsdark: "#578d49",
      },
    },
  },
  plugins: [],
};
