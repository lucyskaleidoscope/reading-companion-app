const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = ['web.js', 'web.jsx', 'web.ts', 'web.tsx', ...config.resolver.sourceExts];

// Alias react-native-screens to our web shim
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-screens') {
    return {
      filePath: path.resolve(__dirname, 'react-native-screens.web.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
