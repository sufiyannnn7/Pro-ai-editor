
export type Language = 'English' | 'Hindi' | 'Other';

export enum EditingGoal {
  NATURAL = 'Natural enhancement',
  PROFESSIONAL = 'Professional photo look',
  SOCIAL_MEDIA = 'Social media ready',
  STUDIO = 'Studio-style lighting',
  CASUAL = 'Casual improvement'
}

export interface UserPreferences {
  language: Language;
  goal: EditingGoal;
}

export interface EditRequest {
  image: string; // Base64
  mimeType: string;
  description: string;
}

export interface EditResult {
  originalImage: string;
  editedImage: string;
  description: string;
}
