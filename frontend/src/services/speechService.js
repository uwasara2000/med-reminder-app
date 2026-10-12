import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class SpeechService {
  constructor() {
    this.isSpeaking = false;
    this.alarmInterval = null;
  }

  speakText(text, options = {}) {
    if (!text) return;

    try {
      this.stop();
      this.isSpeaking = true;

      // Elderly-friendly speech defaults: slightly slower pace (0.85), crystal clear pitch
      const defaultOptions = {
        rate: 0.85,
        pitch: 1.0,
        language: 'en-US',
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: (err) => {
          console.warn('TTS speech error:', err);
          this.isSpeaking = false;
        },
        ...options
      };

      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = defaultOptions.rate;
        utterance.pitch = defaultOptions.pitch;
        utterance.lang = defaultOptions.language;
        utterance.onend = defaultOptions.onDone;
        window.speechSynthesis.speak(utterance);
      } else {
        Speech.speak(text, defaultOptions);
      }
    } catch (e) {
      console.warn('Failed to invoke TTS engine:', e);
      this.isSpeaking = false;
    }
  }

  speakDoseReminder(dose) {
    if (!dose) return;
    const text = dose.voiceAnnouncement || 
      `Attention! It is now ${dose.scheduledTime}. Time for your ${dose.medicationName}, ${dose.dosage}. ${dose.instructions || 'Please take your medication now.'}`;
    this.speakText(text);
  }

  // Active looping alarm for when dose is due like an alarm clock
  startAlarmLoop(dose) {
    this.stopAlarmLoop();

    const alarmMessage = `Attention! Alarm for ${dose.medicationName}. It is ${dose.scheduledTime}. Please take ${dose.dosage} ${dose.instructions || ''}.`;

    // Speak immediately
    this.speakText(alarmMessage);

    // Repeat every 14 seconds until user takes or snoozes dose
    this.alarmInterval = setInterval(() => {
      this.speakText(alarmMessage);
    }, 14000);
  }

  stopAlarmLoop() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    this.stop();
  }

  speakAllDoses(doses) {
    if (!doses || doses.length === 0) {
      this.speakText("You have no medications scheduled for this time.");
      return;
    }

    const pending = doses.filter(d => d.status === 'pending' || d.status === 'snoozed');
    if (pending.length === 0) {
      this.speakText("Great job! All your scheduled medications for today have already been taken.");
      return;
    }

    const count = pending.length;
    const textParts = [`You have ${count} pending medication ${count === 1 ? 'dose' : 'doses'} for today.`];
    
    pending.forEach((d, idx) => {
      textParts.push(`Number ${idx + 1}: ${d.medicationName}, ${d.dosage} at ${d.scheduledTime}.`);
    });

    this.speakText(textParts.join(' '));
  }

  stop() {
    try {
      this.isSpeaking = false;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      } else {
        Speech.stop();
      }
    } catch (e) {
      // Ignore
    }
  }
}

const speechService = new SpeechService();
export default speechService;
