import { useCallback } from 'react';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotificationsApi = {
  ensurePermission: () => Promise<boolean>;
  schedule: (seconds: number) => Promise<string | null>;
  cancel: (id: string | null) => Promise<void>;
};

export function useNotifications(): NotificationsApi {
  const ensurePermission = useCallback(async (): Promise<boolean> => {
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.status === 'granted') return true;
      if (current.status === 'denied' && current.canAskAgain === false) return false;
      const result = await Notifications.requestPermissionsAsync();
      return result.status === 'granted';
    } catch (err) {
      console.warn('[useNotifications] ensurePermission error:', err);
      return false;
    }
  }, []);

  const schedule = useCallback(async (seconds: number): Promise<string | null> => {
    if (seconds <= 0) return null;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rest complete',
          body: 'Time for your next set',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: false,
        } as Notifications.TimeIntervalTriggerInput,
      });
      return id;
    } catch (err) {
      console.warn('[useNotifications] schedule error:', err);
      return null;
    }
  }, []);

  const cancel = useCallback(async (id: string | null): Promise<void> => {
    if (!id) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (err) {
      console.warn('[useNotifications] cancel error:', err);
    }
  }, []);

  return { ensurePermission, schedule, cancel };
}
