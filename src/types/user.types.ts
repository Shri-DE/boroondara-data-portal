/**
 * User Types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  department?: string;
  jobTitle?: string;
  roles: string[];
  avatar?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'en-AU';
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  defaultAgent?: string;
}

export interface UserProfile extends User {
  preferences: UserPreferences;
  lastLogin?: Date;
  createdAt: Date;
}
