export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'sans': ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    }
  }
}
