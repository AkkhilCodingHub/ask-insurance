// Extends the static app.json. On EAS cloud builds the Firebase config files are
// provided as "file" environment variables (their value is the path to the
// materialized file on the build machine), since EAS only uploads git-tracked
// files. Locally these env vars are unset, so we fall back to the paths in app.json.
module.exports = ({ config }) => {
  if (process.env.GOOGLE_SERVICES_PLIST) {
    config.ios = { ...config.ios, googleServicesFile: process.env.GOOGLE_SERVICES_PLIST };
  }
  if (process.env.GOOGLE_SERVICES_JSON) {
    config.android = { ...config.android, googleServicesFile: process.env.GOOGLE_SERVICES_JSON };
  }
  return config;
};
