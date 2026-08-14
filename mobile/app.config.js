/**
 * Dynamic Expo Config allowing local/cloud builds without committing Firebase files.
 */
module.exports = ({ config }) => {
  const googleServicesJson = process.env.GOOGLE_SERVICES_JSON;
  const googleServicesPlist = process.env.GOOGLE_SERVICES_PLIST;

  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: googleServicesJson || config.android?.googleServicesFile,
    },
    ios: {
      ...config.ios,
      googleServicesFile: googleServicesPlist || config.ios?.googleServicesFile,
    },
  };
};
