export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['Billiers', 'serif'],
        'sans': ['Bosch', 'sans-serif'], // This makes Bosch the default
      }
    }
  }
}