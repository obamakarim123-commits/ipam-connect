import Pusher from 'pusher';
import PusherJS from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || '',
  useTLS: true,
});

// Client-side Pusher setup (for use in client components)
export function initPusherClient() {
  return new PusherJS(process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '', {
    cluster: process.env.PUSHER_CLUSTER || '',
  });
}

// Channel name builders
export const getDirectMessageChannelName = (userId1: string, userId2: string) => {
  const ids = [userId1, userId2].sort();
  return `direct-${ids[0]}-${ids[1]}`;
};

export const getCourseGroupChannelName = (courseId: string) => {
  return `course-${courseId}`;
};

export const getPresenceChannelName = (courseId: string) => {
  return `presence-course-${courseId}`;
};

export const getAnnouncementChannelName = () => {
  return 'announcements';
};

// Event types
export enum PusherEventType {
  NEW_MESSAGE = 'new-message',
  MESSAGE_DELETED = 'message-deleted',
  FILE_UPLOADED = 'file-uploaded',
  USER_JOINED = 'user-joined',
  USER_LEFT = 'user-left',
  ANNOUNCEMENT = 'announcement',
  NOTIFICATION = 'notification',
}
