export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        acts: {
          teal: '#00796b',
          admin: '#37474f',
          citizen: '#1976d2',
          critical: '#d32f2f',
          high: '#f57c00',
          medium: '#fbc02d',
          bg: '#eceff1',
          mapBg: '#e5e3df',
        }
      }
    },
  },
  plugins: [],
}
