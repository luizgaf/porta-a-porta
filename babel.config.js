module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@': './',
          '@/components': './components',
          '@/hooks': './hooks',
          '@/store': './store',
          '@/services': './services',
          '@/types': './types',
          '@/utils': './utils',
          '@/constants': './constants',
          '@/assets': './assets',
        },
      }],
    ],
  };
};