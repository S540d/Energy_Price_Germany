import { renderHook, act } from '@testing-library/react-native';
import {
  usePriceAlertNotification,
  requestAlertNotificationPermission,
} from '../usePriceAlertNotification';

const NotificationConstructor = jest.fn();
const mockNotification = {
  permission: 'granted' as NotificationPermission,
  requestPermission: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockNotification.permission = 'granted';
  mockNotification.requestPermission = jest.fn().mockResolvedValue('granted');
  Object.defineProperty(window, 'Notification', {
    writable: true,
    value: Object.assign(NotificationConstructor, mockNotification),
  });
});

describe('usePriceAlertNotification', () => {
  it('fires notification on transition to high', () => {
    const { rerender } = renderHook(
      ({ alertState }: { alertState: 'none' | 'low' | 'high' }) =>
        usePriceAlertNotification(alertState, 'Strompreis', 'Günstig', 'Teuer'),
      { initialProps: { alertState: 'none' as const } }
    );

    act(() => {
      rerender({ alertState: 'high' });
    });

    expect(NotificationConstructor).toHaveBeenCalledWith('Strompreis', {
      body: 'Teuer',
      icon: '/favicon.ico',
    });
  });

  it('fires notification on transition to low', () => {
    const { rerender } = renderHook(
      ({ alertState }: { alertState: 'none' | 'low' | 'high' }) =>
        usePriceAlertNotification(alertState, 'Strompreis', 'Günstig', 'Teuer'),
      { initialProps: { alertState: 'none' as const } }
    );

    act(() => {
      rerender({ alertState: 'low' });
    });

    expect(NotificationConstructor).toHaveBeenCalledWith('Strompreis', {
      body: 'Günstig',
      icon: '/favicon.ico',
    });
  });

  it('does not fire when state stays none', () => {
    const { rerender } = renderHook(
      ({ alertState }: { alertState: 'none' | 'low' | 'high' }) =>
        usePriceAlertNotification(alertState, 'Strompreis', 'Günstig', 'Teuer'),
      { initialProps: { alertState: 'none' as const } }
    );

    act(() => {
      rerender({ alertState: 'none' });
    });

    expect(NotificationConstructor).not.toHaveBeenCalled();
  });

  it('does not fire twice for the same state', () => {
    const { rerender } = renderHook(
      ({ alertState }: { alertState: 'none' | 'low' | 'high' }) =>
        usePriceAlertNotification(alertState, 'Strompreis', 'Günstig', 'Teuer'),
      { initialProps: { alertState: 'none' as const } }
    );

    act(() => {
      rerender({ alertState: 'high' });
    });
    act(() => {
      rerender({ alertState: 'high' });
    });

    expect(NotificationConstructor).toHaveBeenCalledTimes(1);
  });

  it('does not request permission itself and skips while undecided', () => {
    mockNotification.permission = 'default';
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: Object.assign(NotificationConstructor, mockNotification),
    });

    const { rerender } = renderHook(
      ({ alertState }: { alertState: 'none' | 'low' | 'high' }) =>
        usePriceAlertNotification(alertState, 'Strompreis', 'Günstig', 'Teuer'),
      { initialProps: { alertState: 'none' as const } }
    );

    act(() => {
      rerender({ alertState: 'high' });
    });

    expect(mockNotification.requestPermission).not.toHaveBeenCalled();
    expect(NotificationConstructor).not.toHaveBeenCalled();
  });

  it('requestAlertNotificationPermission asks only while undecided', () => {
    mockNotification.permission = 'default';
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: Object.assign(NotificationConstructor, mockNotification),
    });
    requestAlertNotificationPermission();
    expect(mockNotification.requestPermission).toHaveBeenCalledTimes(1);

    mockNotification.permission = 'granted';
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: Object.assign(NotificationConstructor, mockNotification),
    });
    requestAlertNotificationPermission();
    expect(mockNotification.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('silently skips when permission is denied', () => {
    mockNotification.permission = 'denied';
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: Object.assign(NotificationConstructor, mockNotification),
    });

    const { rerender } = renderHook(
      ({ alertState }: { alertState: 'none' | 'low' | 'high' }) =>
        usePriceAlertNotification(alertState, 'Strompreis', 'Günstig', 'Teuer'),
      { initialProps: { alertState: 'none' as const } }
    );

    act(() => {
      rerender({ alertState: 'high' });
    });

    expect(NotificationConstructor).not.toHaveBeenCalled();
  });
});
