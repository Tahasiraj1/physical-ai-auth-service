/**
 * Utility functions for avatar generation
 */

/**
 * Extract the first letter from a user's name for avatar generation
 * Handles edge cases: empty names, special characters, non-ASCII characters
 */
export function extractFirstLetter(name: string | null | undefined): string {
  if (!name || name.trim().length === 0) {
    return '?';
  }

  // Extract first alphanumeric character (case-insensitive)
  const match = name.trim().match(/[a-zA-Z0-9]/);
  
  if (match) {
    return match[0].toUpperCase();
  }

  // If no alphanumeric character found, try to extract first Unicode character
  const firstChar = name.trim().charAt(0);
  if (firstChar) {
    return firstChar.toUpperCase();
  }

  // Fallback to default
  return '?';
}

/**
 * Generate a color for the avatar based on the first letter
 * Returns a hex color code
 */
export function generateAvatarColor(letter: string): string {
  // Simple hash-based color generation for consistent colors per letter
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
    '#EC7063', '#5DADE2', '#58D68D', '#F4D03F', '#AF7AC5',
    '#85C1E9', '#F39C12', '#E74C3C', '#3498DB', '#2ECC71',
    '#9B59B6', '#1ABC9C', '#E67E22', '#34495E', '#16A085',
    '#27AE60', '#2980B9', '#8E44AD', '#C0392B', '#D35400'
  ];

  const index = letter.charCodeAt(0) % colors.length;
  return colors[index];
}

