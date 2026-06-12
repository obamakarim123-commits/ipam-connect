import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { AuthenticationError, AuthorizationError, ValidationError, AppError } from './errors';

export async function getAuthSession() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.email) {
    throw new AuthenticationError('Authentication required');
  }
  return session;
}

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.email) {
    return createJsonResponse({ error: 'Unauthorized' }, 401);
  }
  return session;
}

export async function requireRole(roles: string[]) {
  const session = await getAuthSession();
  if (!roles.includes(session.user?.role as string)) {
    throw new AuthorizationError('Insufficient permissions');
  }
  return session;
}

export function createJsonResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function createErrorResponse(message: string, statusCode: number = 400) {
  return NextResponse.json(
    { error: message },
    { status: statusCode }
  );
}

export function createSuccessResponse(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    message,
    data,
  });
}

export async function parseRequestBody(request: NextRequest) {
  try {
    return await request.json();
  } catch (error) {
    throw new ValidationError('Invalid request body');
  }
}

export function validateObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

export function getPaginationParams(request: NextRequest) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
