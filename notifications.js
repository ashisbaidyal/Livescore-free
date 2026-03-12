/**
 * Notifications Module for LiveScoreFree
 * Handles browser notifications for goal events and match updates
 * 
 * Usage:
 * - Call requestNotificationPermission() on app load
 * - Call triggerGoalNotification(team, player) when goal occurs
 * - Call triggerMatchNotification(title, body) for other events
 */

const NOTIFICATION_PERMISSION_KEY = 'lsf_notification_permission_asked';
const NOTIFICATION_PREF_KEY = 'lsf_notification_preferences';
const NOTIFICATION_SOUND_KEY = 'lsf_notification_sound_enabled';

class NotificationManager {
  constructor() {
    this.enabled = false;
    this.soundEnabled = localStorage.getItem(NOTIFICATION_SOUND_KEY) !== 'false';
    this.favoriteTeams = new Set(JSON.parse(localStorage.getItem('lsf_favorite_teams') || '[]'));
    this.notificationQueue = [];
    this.lastNotificationTime = {};
    this.minNotificationInterval = 3000; // Min 3 seconds between notifications
    
    // Initialize
    this.checkPermission();
  }

  /**
   * Check current notification permission status
   */
  checkPermission() {
    if ('Notification' in window) {
      this.enabled = Notification.permission === 'granted';
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.enabled = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        this.enabled = permission === 'granted';
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
        return this.enabled;
      } catch (error) {
        console.error('Notification permission error:', error);
        return false;
      }
    }

    return false;
  }

  /**
   * Trigger goal notification
   */
  triggerGoal(team, player = '', opponent = '') {
    if (!this.enabled) return;

    const title = '⚽ GOAL!';
    const body = player
      ? `${team} - ${player} scores!`
      : `${team} scores against ${opponent}`;

    this.send(title, body, {
      tag: `goal-${Date.now()}`,
      badge: '/logo-mark.svg',
      icon: '/logo-mark.svg'
    });

    if (this.soundEnabled) {
      this.playSound();
    }
  }

  /**
   * Trigger yellow card notification
   */
  triggerYellowCard(team, player = '') {
    if (!this.enabled) return;

    const title = '🟨 Yellow Card';
    const body = player ? `${team} - ${player}` : `${team}`;

    this.send(title, body, {
      tag: `yellow-${Date.now()}`,
      badge: '/logo-mark.svg',
      requireInteraction: false
    });
  }

  /**
   * Trigger red card notification
   */
  triggerRedCard(team, player = '') {
    if (!this.enabled) return;

    const title = '🔴 Red Card!';
    const body = player ? `${team} - ${player}` : `${team}`;

    this.send(title, body, {
      badge: '/logo-mark.svg',
      requireInteraction: true
    });

    if (this.soundEnabled) {
      this.playSound('alert');
    }
  }

  /**
   * Trigger match start notification
   */
  triggerMatchStart(homeTeam, awayTeam) {
    if (!this.enabled) return;

    const title = '⏰ Match Starting';
    const body = `${homeTeam} vs ${awayTeam}`;

    this.send(title, body, {
      tag: `match-start-${Date.now()}`,
      badge: '/logo-mark.svg'
    });
  }

  /**
   * Trigger match status change
   */
  triggerMatchStatus(team, status) {
    if (!this.enabled) return;

    const statusMap = {
      'halftime': '⏯️ Half-Time',
      'fulltime': '🏁 Full-Time',
      'penalty': '🥅 Penalty Shootout'
    };

    const title = statusMap[status] || status;
    const body = team;

    this.send(title, body, {
      badge: '/logo-mark.svg'
    });
  }

  /**
   * Send notification with rate limiting
   */
  send(title, body, options = {}) {
    if (!this.enabled || !('Notification' in window)) {
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (this.lastNotificationTime[title] && now - this.lastNotificationTime[title] < this.minNotificationInterval) {
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        dir: 'auto',
        lang: document.documentElement.lang || 'en',
        ...options
      });

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Track time
      this.lastNotificationTime[title] = now;

      // Auto-close after 6 seconds
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 6000);
      }

      return notification;
    } catch (error) {
      console.error('Notification creation error:', error);
    }
  }

  /**
   * Play notification sound
   */
  playSound(type = 'goal') {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'alert') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else {
        // Goal celebration sound
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(799, audioContext.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }

  /**
   * Add favorite team
   */
  addFavoriteTeam(teamId, teamName = '') {
    this.favoriteTeams.add(teamId);
    this.saveFavoriteTeams();
  }

  /**
   * Get favorite teams
   */
  getFavoriteTeams() {
    return Array.from(this.favoriteTeams);
  }

  /**
   * Save favorite teams to localStorage
   */
  saveFavoriteTeams() {
    localStorage.setItem('lsf_favorite_teams', JSON.stringify(Array.from(this.favoriteTeams)));
  }

  /**
   * Toggle notification settings
   */
  toggleNotifications(enabled) {
    if (enabled && !this.enabled) {
      this.requestPermission();
    } else {
      this.enabled = enabled;
    }
  }

  /**
   * Toggle sound
   */
  toggleSound(enabled) {
    this.soundEnabled = enabled;
    localStorage.setItem(NOTIFICATION_SOUND_KEY, String(enabled));
  }
}

// Export singleton
const notificationManager = new NotificationManager();

// Auto-request permission on first visit
document.addEventListener('DOMContentLoaded', () => {
  const hasAsked = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
  if (!hasAsked && 'Notification' in window && Notification.permission === 'default') {
    // Optional: Auto-request after user shows interest
    // notificationManager.requestPermission();
  }
});

// Example usage in match updates:
// When goal event is received:
// notificationManager.triggerGoal('Manchester United', 'Bruno Fernandes', 'Liverpool');
// 
// When match starts:
// notificationManager.triggerMatchStart('Manchester United', 'Liverpool');
//
// When match ends:
// notificationManager.triggerMatchStatus('Match Ended', 'fulltime');
