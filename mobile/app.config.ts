import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Allows local builds without committing Firebase files.
 *
 * - For local builds, set env vars to absolute paths:
 *   GOOGLE_SERVICES_JSON=/abs/path/to/google-services.json
 *   GOOGLE_SERVICES_PLIST=/abs/path/to/GoogleService-Info.plist
 *
 * - For cloud builds, use EAS file env vars and point these to the downloaded paths.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesJson  = process.env.GOOGLE_SERVICES_JSON;
  const googleServicesPlist = process.env.GOOGLE_SERVICES_PLIST;

  return {
    ...(config as ExpoConfig),
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

