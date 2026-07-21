import type { ComponentType } from 'react';

export type AdminTab =
  | 'dashboard'
  | 'users'
  | 'toilets'
  | 'cs'
  | 'store'
  | 'titles'
  | 'system'
  | 'add-item'
  | 'edit-item'
  | 'add-title'
  | 'edit-title'
  | 'logs';

export const COLORS = {
  primary: '#1B4332',
  secondary: '#2D6A4F',
  accent: '#E8A838',
  error: '#FF4B4B',
  warning: '#F4A261',
  info: '#3B82F6',
  surface: '#FFFFFF',
  background: '#f8faf9',
  border: 'rgba(26,43,39,0.08)',
  textPrimary: '#1A2B27',
  textSecondary: 'rgba(26,43,39,0.5)',
};
