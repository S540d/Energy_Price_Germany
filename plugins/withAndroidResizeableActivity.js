const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Sets android:resizeableActivity="true" on the main activity.
 * Expo's config schema has no built-in property for this (Play Store
 * large-screen/orientation warning, Android 16) — see Issue #381.
 */
function withAndroidResizeableActivity(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    const mainActivity = application?.activity?.find(
      (activity) => activity.$['android:name'] === '.MainActivity'
    );

    if (mainActivity) {
      mainActivity.$['android:resizeableActivity'] = 'true';
    }

    return config;
  });
}

module.exports = withAndroidResizeableActivity;
