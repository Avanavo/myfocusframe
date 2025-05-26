import type { ActionItem } from '@/types';

const ACTION_ITEMS_KEY = 'sphereOfControlActionItems';

export function loadActionItems(): ActionItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const itemsJson = localStorage.getItem(ACTION_ITEMS_KEY);
    return itemsJson ? JSON.parse(itemsJson) : [];
  } catch (error) {
    console.error('Failed to load action items from localStorage:', error);
    return [];
  }
}

export function saveActionItems(items: ActionItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(ACTION_ITEMS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save action items to localStorage:', error);
  }
}
