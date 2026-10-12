const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalGetPolyfills = config.serializer?.getPolyfills || (() => []);

config.serializer = {
  ...config.serializer,
  getPolyfills: (params) => {
    return [
      path.resolve(__dirname, 'src', 'polyfills.js'),
      ...originalGetPolyfills(params),
    ];
  },
};

module.exports = config;
