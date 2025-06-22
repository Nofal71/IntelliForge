import { getFirestore, collection, getDocs, Timestamp } from 'firebase/firestore';
import { getUserData } from './firebase';
import type { Chat, Message } from '../types';

export interface UserAnalytics {
  uid: string;
  email: string;
  displayName?: string;
  messageCount: number;
  sessionCount: number;
  totalSessionDuration: number; // in seconds
  lastActive: string;
}

export const getUserAnalytics = async (uid: string): Promise<UserAnalytics | null> => {
  try {
    const db = getFirestore();
    const userData = await getUserData(uid);
    if (!userData) {
      console.error('User data not found for UID:', uid);
      return null;
    }

    const chatsRef = collection(db, `users/${uid}/chats`);
    const chatsSnapshot = await getDocs(chatsRef);
    let messageCount = 0;
    let sessionCount = 0;
    let totalSessionDuration = 0;
    let lastActive: Timestamp | null = null;

    chatsSnapshot.forEach(doc => {
      const chat = doc.data() as Chat;
      const messages = (chat.messages || []) as Message[];
      messageCount += messages.filter(m => m.type === 'user').length;
      sessionCount += 1; // Each chat is a session
      const timestamps = messages.map(m => new Date(m.timestamp).getTime()).filter(t => !isNaN(t));
      if (timestamps.length > 0) {
        const sessionDuration = (Math.max(...timestamps) - Math.min(...timestamps)) / 1000; // seconds
        totalSessionDuration += sessionDuration;
        const latest = Math.max(...timestamps);
        if (!lastActive || latest > lastActive.toMillis()) {
          lastActive = Timestamp.fromMillis(latest);
        }
      }
    });

    return {
      uid,
      email: userData.email || 'Unknown',
      displayName: userData.name || undefined,
      messageCount,
      sessionCount,
      totalSessionDuration: Math.round(totalSessionDuration),
      lastActive: lastActive ? lastActive: 'Never',
    };
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return null;
  }
};