const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['web.js', 'web.jsx', 'web.ts', 'web.tsx', ...config.resolver.sourceExts];

module.exports = config;
