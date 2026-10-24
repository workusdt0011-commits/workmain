// config-overrides.js
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = function override(config, env) {
  if (env === 'production') {
    config.plugins.push(
      new WebpackObfuscator(
        {
          // Keep these lighter for React compatibility
          rotateStringArray: true,
          stringArray: true,
          stringArrayThreshold: 0.8, // 80% of strings obfuscated
          stringArrayEncoding: ['rc4'], // More efficient and safe
          splitStrings: true, // Splits long strings to make it harder to read
          splitStringsChunkLength: 5, // Keep short for better security
          controlFlowFlattening: false, // Turned off to preserve React functionality
          deadCodeInjection: false, // Turned off for stability
          debugProtection: false, // Removed for performance
          disableConsoleOutput: true,
        },
        [
            '**/node_modules/**', // Don't touch dependencies
            '**/*.html', // Keep HTML readable for SEO and meta tags
            '**/*.css', // Preserve CSS styles
            '**/index.js', // Main ReactDOM render file
            '**/App.js', // Main routing and lifecycle hooks
            '**/serviceWorker.js', // Required for PWA functionality
            '**/setupProxy.js', // If you use a proxy for APIs
          ]
           // Exclude third-party libraries and static assets
      )
    );
  }
  return config;
};
