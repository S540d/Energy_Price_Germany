import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { AlertState } from '../utils/priceAlertUtils';

/**
 * Asks for the Web Notification permission. Call it from a user action (e.g. when
 * the user sets a price threshold), never on app start. No-op if not on web,
 * unsupported, or the permission was already decided.
 */
export function requestAlertNotificationPermission() {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => undefined);
  }
}

/**
 * Triggers a Web Notification when the alert state changes (foreground only).
 * Only runs on web platform and only with an already granted permission
 * (see requestAlertNotificationPermission). No-op on Android/iOS.
 *
 * Note: Notifications only appear while the browser tab is open.
 * For background notifications, see GitHub Issue #191.
 */
export function usePriceAlertNotification(
  alertState: AlertState,
  notificationTitle: string,
  notificationLow: string,
  notificationHigh: string
) {
  const prevAlertState = useRef<AlertState>('none');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    const prev = prevAlertState.current;
    const current = alertState;

    // Only fire notification on state transition into an alert state
    if (current === prev) return;
    prevAlertState.current = current;

    if (current === 'none') return;

    const body = current === 'low' ? notificationLow : notificationHigh;

    // Permission is requested elsewhere, on user action; without it we skip silently
    if (Notification.permission !== 'granted') return;
    // eslint-disable-next-line no-new
    new Notification(notificationTitle, { body, icon: '/favicon.ico' });
  }, [alertState, notificationTitle, notificationLow, notificationHigh]);
}
