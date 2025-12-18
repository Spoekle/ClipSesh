import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';

// React Query hooks
import { useUpdateAdminConfig, useUpdatePublicConfig, useBlacklistedUsers } from '../../../hooks/useAdmin';

interface ConfigPanelProps {
  config: {
    denyThreshold: number;
    latestVideoLink: string;
    clipChannelIds?: string[];
    blacklistedSubmitters?: Array<{ username: string; userId: string }>;
    blacklistedStreamers?: string[];
  };
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config }) => {
  const [channelIdsText, setChannelIdsText] = useState<string>(
    config?.clipChannelIds?.join('\n') || ''
  );

  // Local state for editable config fields
  const [denyThreshold, setDenyThreshold] = useState<number>(config?.denyThreshold || 5);
  const [latestVideoLink, setLatestVideoLink] = useState<string>(config?.latestVideoLink || '');

  // Blacklist form states
  const [discordUserInput, setDiscordUserInput] = useState<string>('');
  const [streamerInput, setStreamerInput] = useState<string>('');
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [isAddingStreamer, setIsAddingStreamer] = useState<boolean>(false);
  const [previewUser, setPreviewUser] = useState<{ id: string, username: string, global_name?: string, avatar?: string, discriminator?: string } | null>(null);
  const [userNotFound, setUserNotFound] = useState<boolean>(false);

  // React Query mutations and queries
  const updateAdminConfigMutation = useUpdateAdminConfig();
  const updatePublicConfigMutation = useUpdatePublicConfig();
  const { data: blacklistData, isLoading: blacklistLoading } = useBlacklistedUsers();

  // Update channel IDs when config changes
  useEffect(() => {
    setChannelIdsText(config?.clipChannelIds?.join('\n') || '');
  }, [config?.clipChannelIds]);

  // Update local state when config changes
  useEffect(() => {
    setDenyThreshold(config?.denyThreshold || 5);
    setLatestVideoLink(config?.latestVideoLink || '');
  }, [config?.denyThreshold, config?.latestVideoLink]);

  // Add a null check for the config object
  if (!config) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="col-span-1 w-full bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm text-neutral-900 dark:text-white transition duration-200 p-6 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50"
      >
        <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg mr-3 shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          Configuration
        </h2>
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-neutral-500">Loading configuration...</span>
        </div>
      </motion.div>
    );
  }

  const handleChannelIdsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChannelIdsText(e.target.value);
  };

  // Function to fetch Discord user info
  const fetchDiscordUserInfo = async (userId: string) => {
    if (!userId.trim() || userId.length < 17) {
      setPreviewUser(null);
      setUserNotFound(false);
      return;
    }

    setUserNotFound(false);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.spoekle.com';
      const token = localStorage.getItem('token');

      const response = await fetch(`${backendUrl}/api/admin/discord-user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setPreviewUser(userData);
      } else {
        setPreviewUser(null);
        setUserNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching Discord user:', error);
      setPreviewUser(null);
      setUserNotFound(true);
    }
  };

  // Auto-fetch Discord user info when input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (discordUserInput && discordUserInput.length >= 17) {
        fetchDiscordUserInfo(discordUserInput);
      } else {
        setPreviewUser(null);
        setUserNotFound(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [discordUserInput]);

  // Function to add a Discord user to blacklist
  const handleAddDiscordUser = async () => {
    if (!discordUserInput.trim() || !previewUser) return;

    setIsAddingUser(true);
    const currentSubmitters = config.blacklistedSubmitters || [];

    if (currentSubmitters.some(submitter => submitter.userId === discordUserInput.trim())) {
      alert('User is already blacklisted');
      setIsAddingUser(false);
      return;
    }

    try {
      const adminConfig = {
        denyThreshold: denyThreshold,
        clipChannelIds: channelIdsText.split('\n').map((id: string) => id.trim()).filter((id: string) => id !== ''),
        blacklistedSubmitters: [...currentSubmitters, {
          userId: discordUserInput.trim(),
          username: previewUser.username
        }],
        blacklistedStreamers: config.blacklistedStreamers || []
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
      setDiscordUserInput('');
      setPreviewUser(null);
      setUserNotFound(false);
    } catch (error) {
      console.error('Error adding user to blacklist:', error);
      alert('Failed to add user to blacklist. Please try again.');
    } finally {
      setIsAddingUser(false);
    }
  };

  // Function to remove a Discord user from blacklist
  const handleRemoveDiscordUser = async (userId: string) => {
    try {
      const currentSubmitters = config.blacklistedSubmitters || [];
      const adminConfig = {
        denyThreshold: denyThreshold,
        clipChannelIds: channelIdsText.split('\n').map((id: string) => id.trim()).filter((id: string) => id !== ''),
        blacklistedSubmitters: currentSubmitters.filter(submitter => submitter.userId !== userId),
        blacklistedStreamers: config.blacklistedStreamers || []
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
    } catch (error) {
      console.error('Error removing user from blacklist:', error);
      alert('Failed to remove user from blacklist. Please try again.');
    }
  };

  // Function to add a streamer to blacklist
  const handleAddStreamer = async () => {
    if (!streamerInput.trim()) return;

    setIsAddingStreamer(true);
    const currentStreamers = config.blacklistedStreamers || [];
    const trimmedUsername = streamerInput.trim().toLowerCase();

    if (currentStreamers.some(s => s.toLowerCase() === trimmedUsername)) {
      alert('Streamer is already blacklisted');
      setIsAddingStreamer(false);
      return;
    }

    try {
      const adminConfig = {
        denyThreshold: denyThreshold,
        clipChannelIds: channelIdsText.split('\n').map((id: string) => id.trim()).filter((id: string) => id !== ''),
        blacklistedSubmitters: config.blacklistedSubmitters || [],
        blacklistedStreamers: [...currentStreamers, streamerInput.trim()]
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
      setStreamerInput('');
    } catch (error) {
      console.error('Error adding streamer to blacklist:', error);
      alert('Failed to add streamer to blacklist. Please try again.');
    } finally {
      setIsAddingStreamer(false);
    }
  };

  // Function to remove a streamer from blacklist
  const handleRemoveStreamer = async (streamer: string) => {
    try {
      const currentStreamers = config.blacklistedStreamers || [];
      const adminConfig = {
        denyThreshold: denyThreshold,
        clipChannelIds: channelIdsText.split('\n').map((id: string) => id.trim()).filter((id: string) => id !== ''),
        blacklistedSubmitters: config.blacklistedSubmitters || [],
        blacklistedStreamers: currentStreamers.filter(s => s !== streamer)
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
    } catch (error) {
      console.error('Error removing streamer from blacklist:', error);
      alert('Failed to remove streamer from blacklist. Please try again.');
    }
  };
  const submitConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse channel IDs from textarea (one ID per line)
    const clipChannelIds = channelIdsText
      .split('\n')
      .map((id: string) => id.trim())
      .filter((id: string) => id !== '');

    try {
      // Create separate objects for admin and public configs
      const adminConfig = {
        denyThreshold: denyThreshold,
        clipChannelIds: clipChannelIds,
        blacklistedSubmitters: config.blacklistedSubmitters || [],
        blacklistedStreamers: config.blacklistedStreamers || []
      };

      const publicConfig = {
        latestVideoLink: latestVideoLink
      };

      // Make two separate API calls to update both configs
      await updateAdminConfigMutation.mutateAsync(adminConfig);
      await updatePublicConfigMutation.mutateAsync(publicConfig);

      alert('Configuration saved successfully');
    } catch (error) {
      console.error('Error updating configuration:', error);
      alert('Failed to update configuration. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="col-span-1 w-full bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm text-neutral-900 dark:text-white transition duration-200 p-6 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50"
    >
      <h2 className="text-xl font-semibold mb-6 pb-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg mr-3 shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        Configuration
      </h2>

      {/* Use the local submitConfig instead of the passed handleConfigSubmit */}
      <form onSubmit={submitConfig} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="denyThreshold" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Deny Threshold:
            </label>
            <input
              type="number"
              id="denyThreshold"
              name="denyThreshold"
              value={denyThreshold}
              onChange={(e) => setDenyThreshold(parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
              required
              min="1"
            />
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Number of deny votes needed to reject a clip
            </p>
          </div>

          <div>
            <label htmlFor="latestVideoLink" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Latest Video Link:
            </label>
            <input
              type="text"
              id="latestVideoLink"
              name="latestVideoLink"
              value={latestVideoLink}
              onChange={(e) => setLatestVideoLink(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              YouTube URL to display on the home page
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="clipChannelIds" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Discord Clip Channel IDs:
          </label>
          <textarea
            id="clipChannelIds"
            value={channelIdsText}
            onChange={handleChannelIdsChange}
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors h-28 resize-none"
            placeholder="Enter each Discord channel ID on a new line"
          />
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            List of Discord channel IDs that the bot should monitor for clips (one per line)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discord User Blacklist Section */}
          <div>
            <label htmlFor="discordUserInput" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Add Discord User to Blacklist:
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="discordUserInput"
                type="text"
                value={discordUserInput}
                onChange={(e) => setDiscordUserInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter Discord User ID"
              />
              <button
                type="button"
                onClick={handleAddDiscordUser}
                disabled={!discordUserInput.trim() || !previewUser || isAddingUser}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-neutral-400 text-white rounded-lg font-medium transition duration-200"
              >
                {isAddingUser ? 'Adding...' : 'Add'}
              </button>
            </div>

            {/* Discord User Preview */}
            {discordUserInput && previewUser && (
              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2">
                  {previewUser.avatar && (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${previewUser.id}/${previewUser.avatar}.png?size=32`}
                      alt={previewUser.username}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {previewUser.global_name || previewUser.username}
                  </span>
                </div>
              </div>
            )}

            {discordUserInput && userNotFound && (
              <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  User not found or invalid ID
                </p>
              </div>
            )}

            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Discord user IDs that are blocked from submitting clips
            </p>

            {/* Display current blacklisted submitters */}
            {!blacklistLoading && blacklistData?.blacklistedSubmitters && blacklistData.blacklistedSubmitters.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Blacklisted Users:</h4>
                <div className="space-y-2">
                  {blacklistData.blacklistedSubmitters.map((user) => (
                    <div key={user.id} className="flex items-center justify-between bg-white dark:bg-neutral-800 p-2 rounded border">
                      <div className="flex items-center space-x-2">
                        {user.avatar && (
                          <img
                            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=24`}
                            alt={user.username}
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <div>
                          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                            {user.global_name || user.username}
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 block">
                            ID: {user.id}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDiscordUser(user.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove from blacklist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Streamer Blacklist Section */}
          <div>
            <label htmlFor="streamerInput" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Add Streamer to Blacklist:
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="streamerInput"
                type="text"
                value={streamerInput}
                onChange={(e) => setStreamerInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter streamer username"
              />
              <button
                type="button"
                onClick={handleAddStreamer}
                disabled={!streamerInput.trim() || isAddingStreamer}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-neutral-400 text-white rounded-lg font-medium transition duration-200"
              >
                {isAddingStreamer ? 'Adding...' : 'Add'}
              </button>
            </div>

            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Streamer usernames whose clips will be automatically blocked
            </p>

            {/* Display current blacklisted streamers */}
            {!blacklistLoading && blacklistData?.blacklistedStreamers && blacklistData.blacklistedStreamers.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Blacklisted Streamers:</h4>
                <div className="space-y-2">
                  {blacklistData.blacklistedStreamers.map((streamer, index) => (
                    <div key={index} className="flex items-center justify-between bg-white dark:bg-neutral-800 p-2 rounded border">
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {streamer}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStreamer(streamer)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove from blacklist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition duration-200 flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Update Settings
        </button>
      </form>
    </motion.div>
  );
};

export default ConfigPanel;
