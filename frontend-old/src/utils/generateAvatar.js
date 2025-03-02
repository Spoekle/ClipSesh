/**
 * Generates a placeholder avatar based on the user's initials and username
 * @param {string} username - User's username to generate avatar from
 * @param {string} size - Size of the avatar (default: 256px)
 * @returns {string} URL to the generated avatar image
 */
const generateAvatar = (username, size = 256) => {
  if (!username) return null;
  
  // Use the username to create a consistent but random-looking color
  const getColor = (str) => {
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
  const getInitials = (name) => {
    const parts = name.split(/[^a-zA-Z0-9]/); // Split by non-alphanumeric chars
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
    
    return initials;
  };
  
  const backgroundColor = getColor(username);
  const initials = getInitials(username);
  const textColor = '#FFFFFF'; // White text
  
  // API that generates avatars with initials (UI Avatars)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(backgroundColor.replace('#', ''))}&color=${encodeURIComponent(textColor.replace('#', ''))}&size=${size}&bold=true`;
};

export default generateAvatar;
