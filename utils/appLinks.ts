/**
 * Central place for all outbound links to the app's own distribution channels.
 *
 * Keep the Play Store id in sync with `android.package` in app.json — a typo here
 * is a dead link for every user who taps "Rate on Play Store".
 */

export const ANDROID_PACKAGE_ID = 'com.sven4321.energypricegermany';

export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`;

export const WEB_APP_URL = 'https://s540d.github.io/Energy_Price_Germany/';

export const GITHUB_REPO_URL = 'https://github.com/S540d/Energy_Price_Germany';
