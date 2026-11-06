import React from 'react';

/**
 * Generates a placeholder avatar based on the user's initials and username
 * @param username - User's username to generate avatar from
 * @param size - Size of the avatar (default: 256px)
 * @returns URL to the generated avatar image
 */
export const generateAvatar = (username?: string | null, size = 256): string => {
  const cleanName = (username || 'User').trim();
  if (!cleanName) {
    return `https://ui-avatars.com/api/?name=U&background=f23030&color=FFFFFF&size=${size}&bold=true`;
  }
  
  // Use the username to create a consistent but random-looking color
  const getColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a vibrant color (avoiding too dark or too light colors)
    const hue = Math.abs(hash % 360);
    const saturation = 70 + Math.abs(hash % 30); // 70-100%
    const lightness = 45 + Math.abs(hash % 10); // 45-55%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };
  
  // Get initials from username
  const getInitials = (name: string) => {
    const parts = name.split(/[^a-zA-Z0-9]/).filter(Boolean);
    let initials = '';
    
    for (let i = 0; i < Math.min(parts.length, 2); i++) {
      if (parts[i].length > 0) {
        initials += parts[i][0].toUpperCase();
      }
    }
    
    if (initials.length === 0) {
      initials = name.substring(0, 2).toUpperCase();
    } else if (initials.length === 1 && name.length > 1) {
      initials += name[1].toUpperCase();
    }
    
    return initials || 'U';
  };
  
  const backgroundColor = getColor(cleanName);
  const initials = getInitials(cleanName);
  const textColor = '#FFFFFF'; // White text
  
  // API that generates avatars with initials (UI Avatars)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(backgroundColor.replace('#', ''))}&color=${encodeURIComponent(textColor.replace('#', ''))}&size=${size}&bold=true`;
};

/**
 * Returns the user's custom profile picture if valid, or falls back to the generated avatar
 */
export const getUserAvatarUrl = (username?: string, profilePicture?: string | null, size = 256): string => {
  if (
    profilePicture &&
    typeof profilePicture === 'string' &&
    profilePicture.trim() !== '' &&
    !profilePicture.includes('profile_placeholder.png')
  ) {
    return profilePicture;
  }
  return generateAvatar(username, size);
};

/**
 * Event handler for img onError to fall back to the generated avatar when image returns 404 or fails
 */
export const handleAvatarError = (
  e: React.SyntheticEvent<HTMLImageElement>,
  username?: string,
  size = 256
): void => {
  const fallback = generateAvatar(username, size);
  if (fallback && e.currentTarget.src !== fallback) {
    e.currentTarget.onerror = null; // Prevent infinite error loops
    e.currentTarget.src = fallback;
  }
};

export default generateAvatar;
