export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: ThemePreference;
}

export interface User {
  id: string;
  displayName: string;
  email?: string;
  roles: string[];
  enabled: boolean;
  oauthProvider?: string; // 'google' etc
  oauthSubject?: string; // Provider-specific user ID
  avatarUrl?: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
