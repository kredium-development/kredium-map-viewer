/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: [
    // Example content paths...
    './public/**/*.html',
    './src/**/*.{js,jsx,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      colors: {
        'primary' : '#1C604A',
        'primary-light' : '#23785B',
        'dark' : '#241C15',
        'yellow' : '#DAC241',
        'light-yellow' : '#EFDE31',
        'oil' : '#F6F6F0',
        'dark-silver' : '#595959',
        'silver' : '#F7F7F7',
        'stroke' : '#E5E5E5',
        'green' : '#A2B944',
        'unit-green' : '#11E69752',
        'unit-orange' : '#FFBE2052',
        'unit-red' : '#ED151552',
        'pea-green' : '#F0F9F5',
        'light-green' : '#D9F2E4',
        'neon-blue' : '#00CEC9',
        'purple' : '#5563B7',
        'pink' : '#C14A6E',
        'mercury' : '#EDEDED',
        'secondary-dark' : '#5C4C37',
        'secondary-white' : '#EFEFEF',
        'secondary-primary' : '#339671',
        'secondary-silver' : '#D6D6D6',
      },
    },
  },
  plugins: [],
}
