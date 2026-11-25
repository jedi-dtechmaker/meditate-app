const { withAndroidManifest } = require('expo/config-plugins');
module.exports = function withDevelopmentNetwork(config, { enabled = false } = {}) {
  return withAndroidManifest(config, (result) => {
    const application = result.modResults.manifest.application[0];
    application.$['android:usesCleartextTraffic'] = enabled ? 'true' : 'false';
    return result;
  });
};
