const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// When `useFrameworks: "static"` is enabled (required by @react-native-firebase),
// the RNFBApp/RNFBAuth pods are built as framework modules. Their headers import
// non-modular React headers (e.g. <React/RCTConvert.h>), which Clang rejects under
// -Werror,-Wnon-modular-include-in-framework-module. Allow it across all pod targets.
const SNIPPET = `    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
`;

module.exports = function withFirebaseNonModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (!contents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        contents = contents.replace(
          /post_install do \|installer\|\n/,
          (match) => `${match}${SNIPPET}`
        );
        fs.writeFileSync(podfilePath, contents);
      }
      return config;
    },
  ]);
};
