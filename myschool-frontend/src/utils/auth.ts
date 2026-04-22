import type { AuthUser } from '../types';

export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as AuthUser) : null;
};

export const getRole = (): string | null => getUser()?.role ?? null;

export const getLinkedStudentId = (): number | null =>
  getUser()?.linkedStudentId ?? null;

export const isAuthenticated = (): boolean =>
  !!localStorage.getItem('token');

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const scoreClass = (score: number): 'high' | 'medium' | 'low' => {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};
