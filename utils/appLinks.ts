/**
 * Central place for all outbound links to the app's own distribution channels.
 *
 * Keep the Play Store id in sync with `android.package` in app.json — a typo here
 * is a dead link for every user who taps "Rate on Play Store".
 */

export const ANDROID_PACKAGE_ID = 'com.sven4321.energypricegermany';

export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`;

/** Single campaign name so all web→store entry points aggregate in one report row. */
export const WEB_TO_STORE_CAMPAIGN = 'webapp';

/**
 * Play Store link with campaign attribution.
 *
 * Google Play only attributes installs when the UTM string sits inside a single
 * URL-encoded `referrer` parameter — bare `utm_source=`/`utm_medium=` query params
 * on the details URL are ignored and show up nowhere in the Play Console.
 * The campaign then appears in Play Console → Nutzergewinnung (acquisition reports);
 * no in-app Install Referrer API integration is needed for that.
 *
 * Keep the values in sync with the ones hardcoded in `public/index.html` (the web
 * template cannot import from here) — see docs/DISCOVERABILITY.md.
 */
export function playStoreUrlWithCampaign(source: string, medium: string): string {
  const referrer = `utm_source=${source}&utm_medium=${medium}&utm_campaign=${WEB_TO_STORE_CAMPAIGN}`;
  return `${PLAY_STORE_URL}&referrer=${encodeURIComponent(referrer)}`;
}

export const WEB_APP_URL = 'https://s540d.github.io/Energy_Price_Germany/';

export const GITHUB_REPO_URL = 'https://github.com/S540d/Energy_Price_Germany';
