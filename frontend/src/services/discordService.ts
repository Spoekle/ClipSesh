import apiUrl from '../config/config';

/**
 * Start Discord OAuth linking process
 */
export const linkDiscordAccount = (userId: string): void => {
  const discordAuthUrl = `${apiUrl}/api/discord/auth?siteUserId=${encodeURIComponent(userId)}`;
  window.location.href = discordAuthUrl;
};

/**
 * Unlink Discord account by clearing Discord fields
 */
export const unlinkDiscordAccount = async (userId: string): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${apiUrl}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      discordId: '',
      discordUsername: ''
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to unlink Discord account');
  }
};
