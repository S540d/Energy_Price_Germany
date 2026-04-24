import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePriceAlertNotification } from '../usePriceAlertNotification';

const NotificationConstructor = jest.fn();
const mockNotification = {
  permission: 'granted' as NotificationPermission,
  requestPermission: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockNotification.permission = 'granted';
  mockNotification.requestPermission = jest.fn().mockResolvedValue('granted');
  Object.defineProperty(globalThis, 'Notification', {
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

  it('requests permission when default and fires on grant', async () => {
    mockNotification.permission = 'default';
    Object.defineProperty(globalThis, 'Notification', {
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

    await waitFor(() => {
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(NotificationConstructor).toHaveBeenCalledWith('Strompreis', {
        body: 'Teuer',
        icon: '/favicon.ico',
      });
    });
  });

  it('silently skips when permission is denied', () => {
    mockNotification.permission = 'denied';
    Object.defineProperty(globalThis, 'Notification', {
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
