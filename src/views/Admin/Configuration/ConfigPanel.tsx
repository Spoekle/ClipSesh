import { safeLocalStorage } from '@/utils/storage';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { FaCog, FaCheck, FaTimes, FaDiscord, FaTrashAlt } from 'react-icons/fa';

// React Query hooks
import { useUpdateAdminConfig, useUpdatePublicConfig, useBlacklistedUsers } from '../../../hooks/useAdmin';
import { useNotification } from '../../../context/AlertContext';

interface ConfigPanelProps {
  config: {
    denyThreshold: number;
    latestVideoLink: string;
    clipChannelIds?: string[];
    blacklistedSubmitters?: Array<{ username: string; userId: string }>;
    blacklistedStreamers?: string[];
  };
  onOpenScraper?: (channelId?: string) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onOpenScraper }) => {
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
  const [previewUser, setPreviewUser] = useState<{ id: string; username: string; global_name?: string; avatar?: string; discriminator?: string } | null>(null);
  const [userNotFound, setUserNotFound] = useState<boolean>(false);

  // React Query mutations and queries
  const updateAdminConfigMutation = useUpdateAdminConfig();
  const updatePublicConfigMutation = useUpdatePublicConfig();
  const { data: blacklistData, isLoading: blacklistLoading } = useBlacklistedUsers();
  const { showSuccess, showError, showWarning } = useNotification();

  // Update channel IDs when config changes
  useEffect(() => {
    setChannelIdsText(config?.clipChannelIds?.join('\n') || '');
  }, [config?.clipChannelIds]);

  // Update local state when config changes
  useEffect(() => {
    setDenyThreshold(config?.denyThreshold || 5);
    setLatestVideoLink(config?.latestVideoLink || '');
  }, [config?.denyThreshold, config?.latestVideoLink]);

  if (!config) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[#181818] border border-[#262626] text-[#f1f1f1] p-6 rounded-2xl"
      >
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#f23030] border-t-transparent"></div>
          <span className="ml-3 text-[#aaaaaa] text-xs">Loading configuration...</span>
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
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const token = safeLocalStorage.getItem('token');

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
      showWarning('User is already blacklisted');
      setIsAddingUser(false);
      return;
    }

    try {
      const adminConfig = {
        denyThreshold: denyThreshold,
        clipChannelIds: channelIdsText.split('\n').map((id: string) => id.trim()).filter((id: string) => id !== ''),
        blacklistedSubmitters: [
          ...currentSubmitters,
          {
            username: previewUser.username,
            userId: discordUserInput.trim()
          }
        ],
        blacklistedStreamers: config.blacklistedStreamers || []
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
      showSuccess('User added to blacklist successfully');
      setDiscordUserInput('');
      setPreviewUser(null);
    } catch (error) {
      console.error('Error adding user to blacklist:', error);
      showError('Failed to add user to blacklist. Please try again.');
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
        blacklistedSubmitters: currentSubmitters.filter(s => s.userId !== userId),
        blacklistedStreamers: config.blacklistedStreamers || []
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
      showSuccess('User removed from blacklist');
    } catch (error) {
      console.error('Error removing user from blacklist:', error);
      showError('Failed to remove user from blacklist. Please try again.');
    }
  };

  // Function to add a streamer to blacklist
  const handleAddStreamer = async () => {
    if (!streamerInput.trim()) return;

    setIsAddingStreamer(true);
    const currentStreamers = config.blacklistedStreamers || [];

    if (currentStreamers.includes(streamerInput.trim())) {
      showWarning('Streamer is already blacklisted');
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
      showSuccess('Streamer added to blacklist successfully');
      setStreamerInput('');
    } catch (error) {
      console.error('Error adding streamer to blacklist:', error);
      showError('Failed to add streamer to blacklist. Please try again.');
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
      showSuccess('Streamer removed from blacklist');
    } catch (error) {
      console.error('Error removing streamer from blacklist:', error);
      showError('Failed to remove streamer from blacklist. Please try again.');
    }
  };

  const submitConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    const clipChannelIds = channelIdsText
      .split('\n')
      .map((id: string) => id.trim())
      .filter((id: string) => id !== '');

    try {
      const adminConfig = {
        denyThreshold: denyThreshold,
        clipChannelIds: clipChannelIds,
        blacklistedSubmitters: config.blacklistedSubmitters || [],
        blacklistedStreamers: config.blacklistedStreamers || []
      };

      const publicConfig = {
        latestVideoLink: latestVideoLink
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
      await updatePublicConfigMutation.mutateAsync(publicConfig);

      showSuccess('Configuration saved successfully');
    } catch (error) {
      console.error('Error updating configuration:', error);
      showError('Failed to update configuration. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-[#181818] border border-[#262626] text-[#f1f1f1] p-6 rounded-2xl"
    >
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#f23030]/15 text-[#f23030] flex items-center justify-center">
            <FaCog size={15} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#f1f1f1]">System Configuration</h2>
            <p className="text-xs text-[#717171]">Global threshold limits, ingest channels, and blacklists</p>
          </div>
        </div>
      </div>

      <form onSubmit={submitConfig} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl">
            <label htmlFor="denyThreshold" className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1.5">
              Deny Threshold
            </label>
            <input
              type="number"
              id="denyThreshold"
              name="denyThreshold"
              value={denyThreshold}
              onChange={(e) => setDenyThreshold(parseInt(e.target.value) || 5)}
              className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2 text-xs text-[#f1f1f1] focus:outline-none focus:border-[#444]"
              required
              min="1"
            />
            <p className="mt-1.5 text-[11px] text-[#717171]">
              Number of deny votes needed to automatically reject a clip
            </p>
          </div>

          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl">
            <label htmlFor="latestVideoLink" className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1.5">
              Latest Video Link
            </label>
            <input
              type="text"
              id="latestVideoLink"
              name="latestVideoLink"
              value={latestVideoLink}
              onChange={(e) => setLatestVideoLink(e.target.value)}
              className="w-full bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2 text-xs text-[#f1f1f1] placeholder-[#717171] focus:outline-none focus:border-[#444]"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="mt-1.5 text-[11px] text-[#717171]">
              YouTube episode URL featured on the public home page
            </p>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="clipChannelIds" className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider">
              Discord Ingest Channel IDs
            </label>
            {onOpenScraper && (
              <button
                type="button"
                onClick={() => {
                  const firstId = channelIdsText.split('\n').map(s => s.trim()).find(Boolean);
                  onOpenScraper(firstId);
                }}
                className="text-[11px] font-semibold text-[#5865F2] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FaDiscord size={12} />
                <span>Open Channel Scraper</span>
              </button>
            )}
          </div>
          <textarea
            id="clipChannelIds"
            value={channelIdsText}
            onChange={handleChannelIdsChange}
            className="w-full bg-[#121212] border border-[#262626] text-[#f1f1f1] font-mono rounded-xl p-3 text-xs focus:outline-none focus:border-[#444] h-24 resize-none"
            placeholder="123456789012345678&#10;234567890123456789"
          />
          <p className="mt-1.5 text-[11px] text-[#717171]">
            List of Discord channel IDs monitored by the bot for incoming submissions (one ID per line)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Discord User Blacklist Section */}
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl flex flex-col justify-between">
            <div>
              <label htmlFor="discordUserInput" className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1.5">
                Block Submitter (Discord ID)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="discordUserInput"
                  type="text"
                  value={discordUserInput}
                  onChange={(e) => setDiscordUserInput(e.target.value)}
                  className="flex-1 bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2 text-xs text-[#f1f1f1] placeholder-[#717171] focus:outline-none focus:border-[#444]"
                  placeholder="Enter 18-digit Discord ID"
                />
                <button
                  type="button"
                  onClick={handleAddDiscordUser}
                  disabled={!discordUserInput.trim() || !previewUser || isAddingUser}
                  className="bg-[#f23030] hover:bg-[#d92222] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAddingUser ? 'Adding...' : 'Add'}
                </button>
              </div>

              {/* Discord User Preview */}
              {discordUserInput && previewUser && (
                <div className="mb-2 p-2.5 bg-[#121212] rounded-xl border border-[#333333]">
                  <div className="flex items-center space-x-2">
                    {previewUser.avatar && (
                      <img
                        src={`https://cdn.discordapp.com/avatars/${previewUser.id}/${previewUser.avatar}.png?size=32`}
                        alt={previewUser.username}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="text-xs font-semibold text-[#38bdf8]">
                      {previewUser.global_name || previewUser.username}
                    </span>
                    <span className="text-[10px] text-[#717171]">({previewUser.id})</span>
                  </div>
                </div>
              )}

              {discordUserInput && userNotFound && (
                <div className="mb-2 p-2.5 bg-[#eab308]/10 border border-[#eab308]/20 rounded-xl">
                  <p className="text-[11px] text-[#eab308] font-medium">
                    User not found or invalid Discord ID
                  </p>
                </div>
              )}

              <p className="text-[11px] text-[#717171] mb-3">
                Users prohibited from submitting clips through Discord
              </p>
            </div>

            {/* Display current blacklisted submitters */}
            {!blacklistLoading && blacklistData?.blacklistedSubmitters && blacklistData.blacklistedSubmitters.length > 0 && (
              <div className="mt-2 pt-3 border-t border-[#262626]">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#717171] mb-2">
                  Blacklisted Users ({blacklistData.blacklistedSubmitters.length}):
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {blacklistData.blacklistedSubmitters.map((user) => (
                    <div key={user.id} className="flex items-center justify-between bg-[#121212] p-2 rounded-lg border border-[#262626]">
                      <div className="flex items-center space-x-2 truncate">
                        {user.avatar && (
                          <img
                            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=24`}
                            alt={user.username}
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        <div className="truncate">
                          <span className="text-xs font-medium text-[#f1f1f1]">
                            {user.global_name || user.username}
                          </span>
                          <span className="text-[10px] text-[#717171] block font-mono">
                            {user.id}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDiscordUser(user.id)}
                        className="text-[#717171] hover:text-[#f23030] p-1 transition cursor-pointer"
                        title="Remove from blacklist"
                      >
                        <FaTrashAlt size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Streamer Blacklist Section */}
          <div className="bg-[#141414] border border-[#262626] p-4 rounded-xl flex flex-col justify-between">
            <div>
              <label htmlFor="streamerInput" className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1.5">
                Block Streamer / Channel
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="streamerInput"
                  type="text"
                  value={streamerInput}
                  onChange={(e) => setStreamerInput(e.target.value)}
                  className="flex-1 bg-[#121212] border border-[#262626] rounded-xl px-3.5 py-2 text-xs text-[#f1f1f1] placeholder-[#717171] focus:outline-none focus:border-[#444]"
                  placeholder="Enter streamer handle"
                />
                <button
                  type="button"
                  onClick={handleAddStreamer}
                  disabled={!streamerInput.trim() || isAddingStreamer}
                  className="bg-[#f23030] hover:bg-[#d92222] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAddingStreamer ? 'Adding...' : 'Add'}
                </button>
              </div>

              <p className="text-[11px] text-[#717171] mb-3">
                Streamers whose clips will be automatically blocked from queue
              </p>
            </div>

            {/* Display current blacklisted streamers */}
            {!blacklistLoading && blacklistData?.blacklistedStreamers && blacklistData.blacklistedStreamers.length > 0 && (
              <div className="mt-2 pt-3 border-t border-[#262626]">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#717171] mb-2">
                  Blacklisted Streamers ({blacklistData.blacklistedStreamers.length}):
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {blacklistData.blacklistedStreamers.map((streamer, index) => (
                    <div key={index} className="flex items-center justify-between bg-[#121212] p-2 rounded-lg border border-[#262626]">
                      <span className="text-xs font-medium text-[#f1f1f1] truncate">
                        {streamer}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStreamer(streamer)}
                        className="text-[#717171] hover:text-[#f23030] p-1 transition cursor-pointer"
                        title="Remove from blacklist"
                      >
                        <FaTrashAlt size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2.5 bg-[#f23030] hover:bg-[#d92222] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <FaCheck size={12} />
            <span>Update System Settings</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ConfigPanel;
