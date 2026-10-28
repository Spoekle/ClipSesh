'use client';

import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { BlacklistData } from '@/types/adminTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BlacklistManagementSectionProps {
  discordUserInput: string;
  setDiscordUserInput: (val: string) => void;
  streamerInput: string;
  setStreamerInput: (val: string) => void;
  previewUser: {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
    discriminator?: string;
  } | null;
  userNotFound: boolean;
  isAddingUser: boolean;
  isAddingStreamer: boolean;
  blacklistLoading: boolean;
  blacklistData?: BlacklistData;
  onAddDiscordUser: () => Promise<void>;
  onRemoveDiscordUser: (id: string) => Promise<void>;
  onAddStreamer: () => Promise<void>;
  onRemoveStreamer: (streamer: string) => Promise<void>;
}

export const BlacklistManagementSection: React.FC<BlacklistManagementSectionProps> = ({
  discordUserInput,
  setDiscordUserInput,
  streamerInput,
  setStreamerInput,
  previewUser,
  userNotFound,
  isAddingUser,
  isAddingStreamer,
  blacklistLoading,
  blacklistData,
  onAddDiscordUser,
  onRemoveDiscordUser,
  onAddStreamer,
  onRemoveStreamer,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Discord User Blacklist Section */}
      <div className="bg-cc-ground border border-border p-4 rounded-xl flex flex-col justify-between">
        <div>
          <label
            htmlFor="discordUserInput"
            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
          >
            Block Submitter (Discord ID)
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              id="discordUserInput"
              type="text"
              value={discordUserInput}
              onChange={(e) => setDiscordUserInput(e.target.value)}
              className="flex-1 bg-cc-card border-border text-xs text-white placeholder-muted-foreground"
              placeholder="Enter Discord ID"
            />
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onAddDiscordUser}
              disabled={!discordUserInput.trim() || !previewUser || isAddingUser}
              className="bg-primary text-white hover:bg-primary/90 font-semibold gap-1"
            >
              {isAddingUser && <Loader2 className="size-3 animate-spin" />}
              <span>Add</span>
            </Button>
          </div>

          {/* Discord User Preview */}
          {discordUserInput && previewUser && (
            <div className="mb-2 p-2.5 bg-cc-card rounded-xl border border-border">
              <div className="flex items-center space-x-2">
                {previewUser.avatar && (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${previewUser.id}/${previewUser.avatar}.png?size=32`}
                    alt={previewUser.username}
                    className="size-5 rounded-full"
                  />
                )}
                <span className="text-xs font-semibold text-sky-400">
                  {previewUser.global_name || previewUser.username}
                </span>
                <span className="text-[10px] text-muted-foreground">({previewUser.id})</span>
              </div>
            </div>
          )}

          {discordUserInput && userNotFound && (
            <div className="mb-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-[11px] text-amber-400 font-medium">
                User not found or invalid Discord ID
              </p>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground mb-3">
            Users prohibited from submitting clips through Discord
          </p>
        </div>

        {/* Display current blacklisted submitters */}
        {!blacklistLoading &&
          blacklistData?.blacklistedSubmitters &&
          blacklistData.blacklistedSubmitters.length > 0 && (
            <div className="mt-2 pt-3 border-t border-border">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Blacklisted Users ({blacklistData.blacklistedSubmitters.length}):
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {blacklistData.blacklistedSubmitters.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between bg-cc-card p-2 rounded-lg border border-border"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {user.avatar && (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=24`}
                          alt={user.username}
                          className="size-4 rounded-full"
                        />
                      )}
                      <div className="truncate">
                        <span className="text-xs font-medium text-white">
                          {user.global_name || user.username}
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {user.id}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onRemoveDiscordUser(user.id)}
                      className="text-muted-foreground hover:text-primary"
                      title="Remove from blacklist"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Streamer Blacklist Section */}
      <div className="bg-cc-ground border border-border p-4 rounded-xl flex flex-col justify-between">
        <div>
          <label
            htmlFor="streamerInput"
            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
          >
            Block Streamer / Channel
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              id="streamerInput"
              type="text"
              value={streamerInput}
              onChange={(e) => setStreamerInput(e.target.value)}
              className="flex-1 bg-cc-card border-border text-xs text-white placeholder-muted-foreground"
              placeholder="Enter streamer handle"
            />
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onAddStreamer}
              disabled={!streamerInput.trim() || isAddingStreamer}
              className="bg-primary text-white hover:bg-primary/90 font-semibold gap-1"
            >
              {isAddingStreamer && <Loader2 className="size-3 animate-spin" />}
              <span>Add</span>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground mb-3">
            Streamers whose clips will be automatically blocked from queue
          </p>
        </div>

        {/* Display current blacklisted streamers */}
        {!blacklistLoading &&
          blacklistData?.blacklistedStreamers &&
          blacklistData.blacklistedStreamers.length > 0 && (
            <div className="mt-2 pt-3 border-t border-border">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Blacklisted Streamers ({blacklistData.blacklistedStreamers.length}):
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {blacklistData.blacklistedStreamers.map((streamer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-cc-card p-2 rounded-lg border border-border"
                  >
                    <span className="text-xs font-medium text-white truncate">{streamer}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onRemoveStreamer(streamer)}
                      className="text-muted-foreground hover:text-primary"
                      title="Remove from blacklist"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default BlacklistManagementSection;
