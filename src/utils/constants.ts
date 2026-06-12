// Storage limits
export const STORAGE_LIMIT_MB = 500;
export const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_MB * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// File upload
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'application/zip',
];

export const ALLOWED_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'zip'];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Message limits
export const MAX_MESSAGE_LENGTH = 10000;
export const MIN_MESSAGE_LENGTH = 1;

// Announcement limits
export const MAX_ANNOUNCEMENT_LENGTH = 5000;
export const MIN_ANNOUNCEMENT_LENGTH = 10;

// User roles
export enum UserRole {
  STUDENT = 'student',
  CLASS_REP = 'class-rep',
  ADMIN = 'admin',
}

// Message types
export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  ANNOUNCEMENT = 'announcement',
}

// Academic years
export const ACADEMIC_YEARS = [1, 2, 3, 4, 5];

// Departments (example list - should be fetched from admin config)
export const DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Arts & Sciences',
  'Medicine',
  'Law',
];

// Notification types
export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  GROUP_MESSAGE = 'group_message',
  ANNOUNCEMENT = 'announcement',
  FILE_UPLOADED = 'file_uploaded',
}

// Pusher configuration
export const PUSHER_TIMEOUT_MS = 5000;

// API response codes
export const API_SUCCESS = 'SUCCESS';
export const API_ERROR = 'ERROR';

// Date formats
export const DATE_FORMAT = 'MM/dd/yyyy';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'MM/dd/yyyy HH:mm';
