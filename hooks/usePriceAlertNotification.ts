import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { AlertState } from '../utils/priceAlertUtils';

/**
 * Triggers a Web Notification when the alert state changes (foreground only).
 * Only runs on web platform. No-op on Android/iOS.
 *
 * Note: Notifications only appear while the browser tab is open.
 * For background notifications, see GitHub Issue #191.
 */
export function usePriceAlertNotification(
  alertState: AlertState,
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

    if (Notification.permission === 'granted') {
      new Notification('⚡ Strompreis-Alarm', { body, icon: '/favicon.ico' });
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('⚡ Strompreis-Alarm', { body, icon: '/favicon.ico' });
        }
      });
    }
    // If permission === 'denied', we silently skip (graceful degradation)
  }, [alertState, notificationLow, notificationHigh]);
}
