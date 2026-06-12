import { z } from 'zod';

// File upload validation
export const fileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().max(50 * 1024 * 1024), // 50 MB max
  fileType: z.enum(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'application/zip']),
});

// User onboarding validation
export const onboardingSchema = z.object({
  fullName: z.string().min(2).max(100),
  studentId: z.string().min(3).max(20),
  department: z.string().min(1).max(100),
  academicYear: z.number().min(1).max(5),
});

// Message validation
export const messageSchema = z.object({
  content: z.string().min(1).max(10000),
  courseId: z.string().optional(),
  recipientId: z.string().optional(),
});

// Direct message validation
export const directMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  recipientId: z.string().uuid(),
});

// Course query validation
export const courseQuerySchema = z.object({
  department: z.string().optional(),
  year: z.string().optional(),
  searchTerm: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Announcement creation validation
export const announcementSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(5000),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

// Privacy settings validation
export const privacySchema = z.object({
  showEmail: z.boolean(),
  showDepartment: z.boolean(),
  showYear: z.boolean(),
});

// Presigned URL request validation
export const presignedUrlSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  courseId: z.string().uuid(),
});

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateStudentId(studentId: string): boolean {
  return studentId.length >= 3 && studentId.length <= 20;
}
