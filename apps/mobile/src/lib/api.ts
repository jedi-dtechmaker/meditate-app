import { config } from './config';
import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) { super(message); }
}
export async function api<T>(path: string, options: RequestInit = {}, expectedUserId?: string): Promise<T> {
  if (!supabase || !config.apiUrl) throw new ApiError(503, 'Account services are not available yet.');
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new ApiError(401, 'Please sign in to continue.');
  if (expectedUserId && data.session.user.id !== expectedUserId) throw new ApiError(401, 'The signed-in account has changed.');
  try {
    const response = await fetch(`${config.apiUrl}${path}`, {
      ...options, signal: options.signal || AbortSignal.timeout(60000),
      headers: { 'Content-Type': 'application/json', ...options.headers, Authorization: `Bearer ${data.session.access_token}` },
    });
    if (response.status === 204) return undefined as T;
    const body = await response.json();
    if (!response.ok) throw new ApiError(response.status, body.error || 'We could not complete this request.', body);
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'We could not connect. Your saved content is still available. Please try again when you are online.');
  }
}
