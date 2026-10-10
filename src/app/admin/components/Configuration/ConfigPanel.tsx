'use client';

import { safeLocalStorage } from '@/utils/storage';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { FaCog } from 'react-icons/fa';
import { useUpdateAdminConfig, useUpdatePublicConfig, useBlacklistedUsers } from '@/hooks/useAdmin';
import { useNotification } from '@/context/AlertContext';
import GeneralConfigSection from './GeneralConfigSection';
import BlacklistManagementSection from './BlacklistManagementSection';

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

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onOpenScraper }) => {
  const [channelIdsText, setChannelIdsText] = useState<string>(
    config?.clipChannelIds?.join('\n') || ''
  );
  const [denyThreshold, setDenyThreshold] = useState<number>(config?.denyThreshold || 5);
  const [latestVideoLink, setLatestVideoLink] = useState<string>(config?.latestVideoLink || '');

  const [discordUserInput, setDiscordUserInput] = useState<string>('');
  const [streamerInput, setStreamerInput] = useState<string>('');
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [isAddingStreamer, setIsAddingStreamer] = useState<boolean>(false);
  const [previewUser, setPreviewUser] = useState<{
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
    discriminator?: string;
  } | null>(null);
  const [userNotFound, setUserNotFound] = useState<boolean>(false);

  const updateAdminConfigMutation = useUpdateAdminConfig();
  const updatePublicConfigMutation = useUpdatePublicConfig();
  const { data: blacklistData, isLoading: blacklistLoading } = useBlacklistedUsers();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    setChannelIdsText(config?.clipChannelIds?.join('\n') || '');
  }, [config?.clipChannelIds]);

  useEffect(() => {
    setDenyThreshold(config?.denyThreshold || 5);
    setLatestVideoLink(config?.latestVideoLink || '');
  }, [config?.denyThreshold, config?.latestVideoLink]);

  const handleChannelIdsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChannelIdsText(e.target.value);
  };

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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setPreviewUser(userData);
      } else {
        setPreviewUser(null);
        setUserNotFound(true);
      }
    } catch {
      setPreviewUser(null);
      setUserNotFound(true);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscordUserInfo(discordUserInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [discordUserInput]);

  const handleAddDiscordUser = async () => {
    if (!previewUser) return;

    setIsAddingUser(true);
    try {
      const currentSubmitters = config.blacklistedSubmitters || [];
      const adminConfig = {
        denyThreshold,
        clipChannelIds: channelIdsText
          .split('\n')
          .map((id: string) => id.trim())
          .filter(Boolean),
        blacklistedSubmitters: [
          ...currentSubmitters,
          { username: previewUser.username, userId: previewUser.id },
        ],
        blacklistedStreamers: config.blacklistedStreamers || [],
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
      showSuccess(`User ${previewUser.username} added to blacklist successfully`);
      setDiscordUserInput('');
      setPreviewUser(null);
    } catch {
      showError('Failed to add user to blacklist. Please try again.');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveDiscordUser = async (userId: string) => {
    try {
      const currentSubmitters = config.blacklistedSubmitters || [];
      const adminConfig = {
        denyThreshold,
        clipChannelIds: channelIdsText
          .split('\n')
          .map((id: string) => id.trim())
          .filter(Boolean),
        blacklistedSubmitters: currentSubmitters.filter((u) => u.userId !== userId),
        blacklistedStreamers: config.blacklistedStreamers || [],
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
      showSuccess('User removed from blacklist');
    } catch {
      showError('Failed to remove user from blacklist. Please try again.');
    }
  };

  const handleAddStreamer = async () => {
    if (!streamerInput.trim()) return;

    setIsAddingStreamer(true);
    try {
      const currentStreamers = config.blacklistedStreamers || [];
      const adminConfig = {
        denyThreshold,
        clipChannelIds: channelIdsText
          .split('\n')
          .map((id: string) => id.trim())
          .filter(Boolean),
        blacklistedSubmitters: config.blacklistedSubmitters || [],
        blacklistedStreamers: [...currentStreamers, streamerInput.trim()],
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
      showSuccess('Streamer added to blacklist successfully');
      setStreamerInput('');
    } catch {
      showError('Failed to add streamer to blacklist. Please try again.');
    } finally {
      setIsAddingStreamer(false);
    }
  };

  const handleRemoveStreamer = async (streamer: string) => {
    try {
      const currentStreamers = config.blacklistedStreamers || [];
      const adminConfig = {
        denyThreshold,
        clipChannelIds: channelIdsText
          .split('\n')
          .map((id: string) => id.trim())
          .filter(Boolean),
        blacklistedSubmitters: config.blacklistedSubmitters || [],
        blacklistedStreamers: currentStreamers.filter((s) => s !== streamer),
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
      showSuccess('Streamer removed from blacklist');
    } catch {
      showError('Failed to remove streamer from blacklist. Please try again.');
    }
  };

  const submitConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    const clipChannelIds = channelIdsText
      .split('\n')
      .map((id: string) => id.trim())
      .filter(Boolean);

    try {
      const adminConfig = {
        denyThreshold,
        clipChannelIds,
        blacklistedSubmitters: config.blacklistedSubmitters || [],
        blacklistedStreamers: config.blacklistedStreamers || [],
      };

      const publicConfig = {
        latestVideoLink,
      };

      await updateAdminConfigMutation.mutateAsync(adminConfig);
      await updatePublicConfigMutation.mutateAsync(publicConfig);

      showSuccess('Configuration saved successfully');
    } catch {
      showError('Failed to update configuration. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-cc-card border border-border text-white p-6 rounded-2xl space-y-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <FaCog size={15} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">System Configuration</h2>
            <p className="text-xs text-muted-foreground">
              Global threshold limits, ingest channels, and blacklists
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submitConfig} className="space-y-6">
        <GeneralConfigSection
          denyThreshold={denyThreshold}
          setDenyThreshold={setDenyThreshold}
          latestVideoLink={latestVideoLink}
          setLatestVideoLink={setLatestVideoLink}
          channelIdsText={channelIdsText}
          onChannelIdsChange={handleChannelIdsChange}
          onOpenScraper={onOpenScraper}
          isSubmitting={updateAdminConfigMutation.isPending || updatePublicConfigMutation.isPending}
        />

        <div className="pt-2 border-t border-border">
          <BlacklistManagementSection
            discordUserInput={discordUserInput}
            setDiscordUserInput={setDiscordUserInput}
            streamerInput={streamerInput}
            setStreamerInput={setStreamerInput}
            previewUser={previewUser}
            userNotFound={userNotFound}
            isAddingUser={isAddingUser}
            isAddingStreamer={isAddingStreamer}
            blacklistLoading={blacklistLoading}
            blacklistData={blacklistData}
            onAddDiscordUser={handleAddDiscordUser}
            onRemoveDiscordUser={handleRemoveDiscordUser}
            onAddStreamer={handleAddStreamer}
            onRemoveStreamer={handleRemoveStreamer}
          />
        </div>
      </form>
    </motion.div>
  );
};

export default ConfigPanel;
