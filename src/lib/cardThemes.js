import { base44 } from '@/api/base44Client';

// Saved Magic Card themes. Built-in looks live in cardDesigns; these are the
// ones an admin created (usually with AI) and that survive a refresh.
export const listCardThemes = async () => {
  const page = await base44.entities.CardTheme.list({ sort: '-created_date', limit: 100 });
  return page?.items || page || [];
};

export const createCardTheme = (theme) =>
  base44.entities.CardTheme.create({
    name: theme.name?.trim() || 'New theme',
    blurb: theme.blurb?.trim() || '',
    templateId: theme.templateId,
    colors: theme.colors,
    text: theme.text || '',
    backgroundUri: theme.backgroundUri || '',
    sticker: theme.sticker || '',
    artPrompt: theme.artPrompt || '',
    createdBy: theme.createdBy || '',
  });

export const deleteCardTheme = (id) => base44.entities.CardTheme.delete(id);