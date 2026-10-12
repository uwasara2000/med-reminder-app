import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.Notifications = null;
    this.init();
  }

  async init() {
    if (Platform.OS === 'web') return;
    try {
      // Lazy safe load expo-notifications
      const Notifications = await import('expo-notifications');
      this.Notifications = Notifications;

      if (Notifications.setNotificationHandler) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
      }
    } catch (e) {
      console.log('Notifications not supported in current environment:', e?.message || e);
    }
  }

  async requestPermissions() {
    if (Platform.OS === 'web') return true;

    try {
      if (!this.Notifications) {
        await this.init();
      }
      if (!this.Notifications || !this.Notifications.getPermissionsAsync) return false;

      const { status: existingStatus } = await this.Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted' && this.Notifications.requestPermissionsAsync) {
        const { status } = await this.Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.hasPermission = finalStatus === 'granted';

      if (Platform.OS === 'android' && this.Notifications.setNotificationChannelAsync) {
        try {
          await this.Notifications.setNotificationChannelAsync('medication-reminders', {
            name: 'Medication Reminders',
            importance: this.Notifications.AndroidImportance?.MAX ?? 5,
            vibrationPattern: [0, 500, 250, 500],
            lightColor: '#2563EB',
            sound: 'default',
            enableVibrate: true,
            lockscreenVisibility: this.Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1
          });
        } catch (channelErr) {
          // Expo Go on Android SDK 57 has restricted channel manager
          console.log('Notice: Channel creation skipped in Expo Go:', channelErr?.message || channelErr);
        }
      }

      return this.hasPermission;
    } catch (e) {
      console.log('Notice: Local notifications limited in Expo Go:', e.message);
      return false;
    }
  }

  async scheduleMedicationReminder(dose) {
    if (Platform.OS === 'web') return null;

    try {
      if (!this.Notifications) await this.init();
      if (!this.Notifications || !this.Notifications.scheduleNotificationAsync) return null;

      await this.requestPermissions();

      const [hours, minutes] = dose.scheduledTime.split(':').map(Number);
      
      const identifier = await this.Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 Time for ${dose.medicationName}!`,
          body: `Dose: ${dose.dosage} - ${dose.instructions || 'Please take on time.'}`,
          sound: 'default',
          priority: this.Notifications.AndroidNotificationPriority.MAX,
          data: {
            medicationId: dose.medicationId,
            scheduleId: dose.scheduleId,
            scheduledTime: dose.scheduledTime,
            voiceAnnouncement: dose.voiceAnnouncement
          },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
          channelId: 'medication-reminders',
        },
      });

      return identifier;
    } catch (e) {
      console.log('Notification schedule notice:', e?.message || e);
      return null;
    }
  }

  async cancelAllReminders() {
    if (Platform.OS === 'web') return;
    try {
      if (this.Notifications && this.Notifications.cancelAllScheduledNotificationsAsync) {
        await this.Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (e) {
      // ignore
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
