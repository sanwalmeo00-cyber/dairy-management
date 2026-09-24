import { NextResponse } from 'next/server';

/** Kept for compatibility; prefer jsonSuccess from server/api/http. */
export function sendSuccess<T>(
  _res: unknown,
  data: T,
  statusCode = 200,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    { status: statusCode }
  );
}
