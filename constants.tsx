
import React from 'react';

export const LANGUAGES = ['English', 'Hindi', 'Other'] as const;

export const EDITING_GOALS = [
  { id: 'natural', label: 'Natural enhancement', icon: <i className="fa-solid fa-leaf"></i> },
  { id: 'pro', label: 'Professional photo look', icon: <i className="fa-solid fa-user-tie"></i> },
  { id: 'social', label: 'Social media ready', icon: <i className="fa-brands fa-instagram"></i> },
  { id: 'studio', label: 'Studio-style lighting', icon: <i className="fa-solid fa-lightbulb"></i> },
  { id: 'casual', label: 'Casual improvement', icon: <i className="fa-solid fa-wand-magic-sparkles"></i> },
] as const;

export const SYSTEM_PROMPT_TEMPLATE = `
Enhance the provided photo with professional, natural photo editing.
Goal: [GOAL_HINT]
User Request: [USER_REQUEST]

Instructions:
- Improve lighting softly on the face without altering facial features.
- Correct exposure, highlights, and shadows for balanced illumination.
- Maintain original skin texture and real skin tone.
- Remove minor lighting imperfections only.
- Preserve original facial structure, expression, and identity.
- Keep the image realistic, clean, and high quality.
- NO face reshaping, NO artificial beauty effects.
- Professional DSLR-style result, ultra-realistic, sharp focus, natural colors.

Quality Tags: ultra-realistic, natural skin texture, professional photography, soft light, balanced exposure, sharp focus, high dynamic range, original identity preserved.
Safety Rules: Do NOT change face shape, eyes, nose, or lips. Do NOT beautify unrealistically. Do NOT change age or gender.
`;
