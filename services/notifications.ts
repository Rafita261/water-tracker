// notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});
export class NotificationService {
  static async requestPermissions() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('water-reminders', {
        name: 'Rappels d\'hydratation',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2196F3',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  }

  static async scheduleWaterReminders(dailyGoal: number) {
    // Annuler toutes les notifications précédentes
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Calculer le nombre de rappels nécessaires (entre 8h et 18h)
    const hoursAvailable = 10; // 8h à 18h
    const reminderInterval = Math.floor(hoursAvailable * 60 / 8); 
    // Programmer les notifications
    for (let i = 0; i < 8; i++) {
      const hour = 8 + Math.floor(i * 1.25); // Distribuer entre 8h et 18h
      const minute = (i * 15) % 60;

      await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Temps de s’hydrater !',
            body: `N'oubliez pas de boire de l'eau pour atteindre vos ${dailyGoal}ml`,
            sound: true,
            data: { type: 'water-reminder' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour,
            minute,
            repeats: true,
          },
        });

    }
  }

  static async cancelAllReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  static async sendImmediateNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'immediate' },
      },
      trigger: null,
    });
  }
}