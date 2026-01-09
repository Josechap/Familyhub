// API Configuration
// In development, uses localhost. In production, uses relative path (served from same origin)
export const API_BASE = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

// Google OAuth URL (for redirect)
export const GOOGLE_AUTH_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/google/auth`
  : (import.meta.env.DEV ? 'http://localhost:3001/api/google/auth' : '/api/google/auth');
