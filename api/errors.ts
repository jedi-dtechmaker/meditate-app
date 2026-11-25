import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const asyncRoute = (handler: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (res.headersSent) return;
  if (error instanceof ZodError) res.status(400).json({ error: error.issues[0]?.message || 'Please check your information.' });
  else if (error instanceof HttpError) res.status(error.status).json({ error: error.message });
  else if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
    res.status(413).json({ error: 'This recording or request is too large.' });
  } else if (error instanceof SyntaxError) res.status(400).json({ error: 'The request could not be read.' });
  else {
    console.error('API request failed:', error instanceof Error ? error.name : 'Unknown error');
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
