'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Star, MessageSquare } from 'lucide-react';
import { useNotification } from '@/context/AlertContext';
import { User, Clip, Rating, RatingUser } from '@/types/adminTypes';
import { getRatingById, submitRating } from '@/services/ratingService';
import {
  getMessagesForClip,
  sendMessage,
  deleteMessage,
  Message as MessageType,
  SendMessageData,
} from '@/services/messageService';
import TeamRatingTab from './clipteam/TeamRatingTab';
import TeamChatTab from './clipteam/TeamChatTab';

interface TeamSidebarProps {
  clip: Clip;
  user: User | null;
  ratings: Record<string, Rating>;
  fetchClipsAndRatings: (user: User | null) => Promise<void>;
  highlightedMessageId?: string | null;
}

type TabType = 'rate' | 'chat';

const TeamSidebar: React.FC<TeamSidebarProps> = ({
  clip,
  user,
  ratings,
  fetchClipsAndRatings,
  highlightedMessageId = null,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('rate');

  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localRatings, setLocalRatings] = useState<Record<string, Rating> | null>(null);
  const [userCurrentRating, setUserCurrentRating] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { showError, showSuccess } = useNotification();

  const currentRatingsData = (ratings && ratings[clip._id]) || (localRatings && localRatings[clip._id]);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!ratings || !ratings[clip._id]) {
        setIsRatingLoading(true);
        try {
          const ratingsData = await getRatingById(clip._id);
          if (ratingsData) {
            setLocalRatings({ [clip._id]: ratingsData });
          }
        } catch (error) {
          console.error('Error fetching ratings:', error);
        } finally {
          setIsRatingLoading(false);
        }
      }
    };
    fetchRatings();
  }, [clip._id, ratings]);

  useEffect(() => {
    if (!user || !currentRatingsData) {
      setUserCurrentRating(null);
      return;
    }

    if (currentRatingsData.ratingCounts) {
      for (const ratingGroup of currentRatingsData.ratingCounts) {
        const users = ratingGroup.users || [];
        if (users.some((u: RatingUser) => u && u.userId === user._id)) {
          setUserCurrentRating(ratingGroup.rating.toString());
          return;
        }
      }
    } else if (currentRatingsData.ratings) {
      const ratingCategories = ['1', '2', '3', '4', 'deny'] as const;
      for (const category of ratingCategories) {
        const ratingUsers = currentRatingsData.ratings[category] || [];
        if (ratingUsers.some((u: RatingUser) => u && u.userId === user._id)) {
          setUserCurrentRating(category);
          return;
        }
      }
    }
    setUserCurrentRating(null);
  }, [user, currentRatingsData]);

  const rateOrDenyClip = async (rating: number | null = null, isDeny: boolean = false) => {
    if (isSubmitting || !user) return;

    setIsSubmitting(true);
    try {
      const ratingValue = rating !== null ? (rating.toString() as '1' | '2' | '3' | '4') : 'deny';
      const isRemovingRating = userCurrentRating === ratingValue;

      await submitRating(clip._id, ratingValue);

      if (isRemovingRating) {
        setUserCurrentRating(null);
        showSuccess('Rating removed');
      } else {
        setUserCurrentRating(ratingValue);
        showSuccess(isDeny ? 'Clip marked as denied' : `Rated clip as ${ratingValue}`);
      }

      await fetchClipsAndRatings(user);
    } catch {
      showError('Failed to update rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUserStreamerOrSubmitter = Boolean(
    user && (user.username === clip.streamer || user.username === clip.submitter)
  );

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setChatLoading(true);
        const messagesData = await getMessagesForClip(clip._id);
        setMessages(messagesData);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setChatLoading(false);
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 10000);
    return () => clearInterval(intervalId);
  }, [clip._id]);

  useEffect(() => {
    if (highlightedMessageId) {
      setActiveTab('chat');
    }
  }, [highlightedMessageId]);

  useEffect(() => {
    if (highlightedMessageId && messages.length > 0) {
      const messageElement = document.getElementById(`message-${highlightedMessageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('bg-primary/20');
        setTimeout(() => {
          messageElement.classList.remove('bg-primary/20');
        }, 3000);
      }
    }
  }, [highlightedMessageId, messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const messageData: SendMessageData = {
        clipId: clip._id,
        userId: user._id,
        user: user.username,
        message: newMessage.trim(),
        profilePicture: user.profilePicture,
      };

      const newMessageData = await sendMessage(messageData);
      setMessages((prev) => [newMessageData, ...prev]);
      setNewMessage('');
    } catch {
      showError('Failed to send message');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!user) return;
    try {
      await deleteMessage(id, user._id, user.roles);
      setMessages((prev) => prev.filter((msg) => msg._id !== id));
    } catch {
      showError('Failed to delete message');
    }
  };

  let ratingCounts: Array<{ rating: string; count: number; users: RatingUser[] }> = [];
  if (currentRatingsData?.ratingCounts) {
    ratingCounts = currentRatingsData.ratingCounts;
  } else if (currentRatingsData?.ratings) {
    ratingCounts = [
      { rating: '1', count: (currentRatingsData.ratings['1'] || []).length, users: currentRatingsData.ratings['1'] || [] },
      { rating: '2', count: (currentRatingsData.ratings['2'] || []).length, users: currentRatingsData.ratings['2'] || [] },
      { rating: '3', count: (currentRatingsData.ratings['3'] || []).length, users: currentRatingsData.ratings['3'] || [] },
      { rating: '4', count: (currentRatingsData.ratings['4'] || []).length, users: currentRatingsData.ratings['4'] || [] },
      { rating: 'deny', count: (currentRatingsData.ratings['deny'] || []).length, users: currentRatingsData.ratings['deny'] || [] },
    ];
  }

  const totalRatings = ratingCounts.reduce((acc, curr) => acc + curr.count, 0);
  const numericRatings = ratingCounts.filter((r) => r.rating !== 'deny');
  const averageRating =
    numericRatings.reduce((acc, curr) => acc + curr.count, 0) > 0
      ? (
          numericRatings.reduce((acc, curr) => acc + Number(curr.rating) * curr.count, 0) /
          numericRatings.reduce((acc, curr) => acc + curr.count, 0)
        ).toFixed(1)
      : 'N/A';

  const tabs = [
    { id: 'rate' as TabType, label: 'Rate Clip', icon: Star },
    { id: 'chat' as TabType, label: 'Team Chat', icon: MessageSquare },
  ];

  const isDisabled = isRatingLoading || isSubmitting || isUserStreamerOrSubmitter;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden sticky top-20 text-foreground select-none">
      {/* Tab Header */}
      <div className="flex border-b border-border p-1.5 bg-background">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="size-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'rate' && (
            <TeamRatingTab
              userCurrentRating={userCurrentRating}
              isUserStreamerOrSubmitter={isUserStreamerOrSubmitter}
              isDisabled={isDisabled}
              isSubmitting={isSubmitting}
              rateOrDenyClip={rateOrDenyClip}
              ratingCounts={ratingCounts}
              totalRatings={totalRatings}
              averageRating={averageRating}
            />
          )}

          {activeTab === 'chat' && (
            <TeamChatTab
              messages={messages}
              chatLoading={chatLoading}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              handleDeleteMessage={handleDeleteMessage}
              user={user}
              messagesEndRef={messagesEndRef}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeamSidebar;
