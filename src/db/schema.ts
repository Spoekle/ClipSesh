import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { newId } from '../lib/ids';

// Ids stay 24-char ObjectId-style strings so links and ids migrated from MongoDB keep
// working. The JS key is `_id` so API responses keep the shape the frontend expects.
const id = () => text('id').primaryKey().$defaultFn(newId);
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'] as const;
export const USER_ROLES = ['admin', 'user', 'clipteam', 'editor', 'uploader'] as const;
export const RATING_VALUES = ['1', '2', '3', '4', 'deny'] as const;
export const NOTIFICATION_TYPES = [
  'comment_reply',
  'mention',
  'rating',
  'system',
  'team_message',
  'report',
  'report_update',
] as const;
export const REPORT_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type RatingValue = (typeof RATING_VALUES)[number];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const seasonEnum = pgEnum('season', SEASONS);
export const userStatusEnum = pgEnum('user_status', ['active', 'disabled']);
export const voteTypeEnum = pgEnum('vote_type', ['upvote', 'downvote']);
export const ratingValueEnum = pgEnum('rating_value', RATING_VALUES);
export const notificationTypeEnum = pgEnum('notification_type', NOTIFICATION_TYPES);
export const reportStatusEnum = pgEnum('report_status', REPORT_STATUSES);
export const reportSenderRoleEnum = pgEnum('report_sender_role', ['reporter', 'admin']);

export const users = pgTable(
  'users',
  {
    _id: id(),
    username: text('username').notNull().unique(),
    email: text('email').unique(),
    password: text('password').notNull(),
    profilePicture: text('profile_picture')
      .notNull()
      .default('/profilePictures/profile_placeholder.png'),
    roles: text('roles').array().$type<UserRole[]>().notNull().default(['user']),
    status: userStatusEnum('status').notNull().default('active'),
    discordId: text('discord_id').unique(),
    discordUsername: text('discord_username'),
    ccId: text('cc_id').unique(),
    ccUsername: text('cc_username'),
    joinDate: timestamp('join_date', { withTimezone: true }).defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('users_roles_idx').using('gin', t.roles)]
);

export const clips = pgTable(
  'clips',
  {
    _id: id(),
    link: text('link'),
    url: text('url').notNull(),
    thumbnail: text('thumbnail'),
    streamer: text('streamer').notNull(),
    submitter: text('submitter').notNull(),
    title: text('title').notNull(),
    upvotes: integer('upvotes').notNull().default(0),
    downvotes: integer('downvotes').notNull().default(0),
    views: integer('views').notNull().default(0),
    discordSubmitterId: text('discord_submitter_id'),
    season: seasonEnum('season'),
    year: integer('year'),
    archived: boolean('archived').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('clips_archived_created_idx').on(t.archived, t.createdAt.desc()),
    index('clips_archived_upvotes_idx').on(t.archived, t.upvotes.desc(), t.createdAt.desc()),
    index('clips_archived_downvotes_idx').on(t.archived, t.downvotes.desc(), t.createdAt.desc()),
    index('clips_season_year_idx').on(t.season, t.year, t.archived),
    index('clips_streamer_idx').on(t.streamer),
    index('clips_link_idx').on(t.link),
  ]
);

export const clipComments = pgTable(
  'clip_comments',
  {
    _id: id(),
    clipId: text('clip_id')
      .notNull()
      .references(() => clips._id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    username: text('username').notNull(),
    comment: text('comment').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('clip_comments_clip_idx').on(t.clipId, t.createdAt)]
);

export const clipCommentReplies = pgTable(
  'clip_comment_replies',
  {
    _id: id(),
    commentId: text('comment_id')
      .notNull()
      .references(() => clipComments._id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    username: text('username').notNull(),
    replyText: text('reply_text').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('clip_comment_replies_comment_idx').on(t.commentId, t.createdAt)]
);

// No foreign key to clips: ratings outlive deleted clips so historical rating stats stay intact.
export const clipRatings = pgTable(
  'clip_ratings',
  {
    clipId: text('clip_id').notNull(),
    userId: text('user_id').notNull(),
    username: text('username').notNull().default(''),
    rating: ratingValueEnum('rating').notNull(),
    timestamp: timestamp('rated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.clipId, t.userId] }),
    index('clip_ratings_user_idx').on(t.userId),
    index('clip_ratings_clip_rating_idx').on(t.clipId, t.rating),
  ]
);

export const votes = pgTable(
  'votes',
  {
    clipId: text('clip_id')
      .notNull()
      .references(() => clips._id, { onDelete: 'cascade' }),
    voterToken: text('voter_token').notNull(),
    vote: voteTypeEnum('vote').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.clipId, t.voterToken] })]
);

/** One row per (clip, ip) view within the cooldown window; stale rows are pruned periodically. */
export const clipViews = pgTable(
  'clip_views',
  {
    clipId: text('clip_id')
      .notNull()
      .references(() => clips._id, { onDelete: 'cascade' }),
    ip: text('ip').notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.clipId, t.ip] }), index('clip_views_created_idx').on(t.createdAt)]
);

export const messages = pgTable(
  'messages',
  {
    _id: id(),
    clipId: text('clip_id').notNull(),
    userId: text('user_id'),
    user: text('user').notNull(),
    message: text('message').notNull(),
    profilePicture: text('profile_picture').notNull().default(''),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('messages_clip_idx').on(t.clipId, t.timestamp)]
);

export const notifications = pgTable(
  'notifications',
  {
    _id: id(),
    recipientId: text('recipient_id').notNull(),
    senderId: text('sender_id').notNull(),
    senderUsername: text('sender_username').notNull(),
    type: notificationTypeEnum('type').notNull(),
    entityId: text('entity_id'),
    replyId: text('reply_id'),
    clipId: text('clip_id'),
    read: boolean('read').notNull().default(false),
    message: text('message').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('notifications_recipient_created_idx').on(t.recipientId, t.createdAt.desc()),
    index('notifications_recipient_read_idx').on(t.recipientId, t.read),
  ]
);

// No foreign key to clips: reports stay visible to admins after the clip is deleted.
export const reports = pgTable(
  'reports',
  {
    _id: id(),
    clipId: text('clip_id').notNull(),
    clipTitle: text('clip_title').notNull(),
    clipStreamer: text('clip_streamer').notNull(),
    clipSubmitter: text('clip_submitter').notNull(),
    reporterId: text('reporter_id').notNull(),
    reporterUsername: text('reporter_username').notNull(),
    reason: text('reason').notNull(),
    status: reportStatusEnum('status').notNull().default('pending'),
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    adminNotes: text('admin_notes').notNull().default(''),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('reports_clip_reporter_idx').on(t.clipId, t.reporterId),
    index('reports_reporter_created_idx').on(t.reporterId, t.createdAt.desc()),
    index('reports_status_created_idx').on(t.status, t.createdAt.desc()),
    index('reports_created_idx').on(t.createdAt.desc()),
  ]
);

export const reportMessages = pgTable(
  'report_messages',
  {
    _id: id(),
    reportId: text('report_id')
      .notNull()
      .references(() => reports._id, { onDelete: 'cascade' }),
    senderId: text('sender_id').notNull(),
    senderUsername: text('sender_username').notNull(),
    senderRole: reportSenderRoleEnum('sender_role').notNull(),
    message: text('message').notNull(),
    isInternal: boolean('is_internal').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('report_messages_report_created_idx').on(t.reportId, t.createdAt)]
);

export const reportMessageReads = pgTable(
  'report_message_reads',
  {
    messageId: text('message_id')
      .notNull()
      .references(() => reportMessages._id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    username: text('username').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.userId] })]
);

export const zips = pgTable(
  'zips',
  {
    _id: id(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    season: seasonEnum('season').notNull(),
    year: integer('year').notNull(),
    clipAmount: integer('clip_amount').notNull().default(0),
    size: bigint('size', { mode: 'number' }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('zips_season_year_idx').on(t.season, t.year)]
);

/** Primary key of the single row in each config table. */
export const CONFIG_ROW_ID = 'default';

export const publicConfig = pgTable('public_config', {
  _id: text('id').primaryKey().default(CONFIG_ROW_ID),
  latestVideoLink: text('latest_video_link').notNull().default(''),
  clipAmount: integer('clip_amount').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export interface BlacklistedSubmitter {
  username?: string;
  userId?: string;
}

export interface SeasonTransitionLog {
  timestamp: string;
  action:
    | 'submission_closed'
    | 'season_started'
    | 'auto_zip_started'
    | 'auto_zip_completed'
    | 'auto_zip_failed'
    | 'season_unarchived';
  season: (typeof SEASONS)[number];
  year: number;
  details: string;
}

export interface LastArchivedSeason {
  season: (typeof SEASONS)[number];
  year: number;
  jobId?: string;
  archivedAt: string;
  clipCount: number;
  zipUrl?: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface SeasonRef {
  season: (typeof SEASONS)[number];
  year: number;
}

export interface SeasonAutomationConfig {
  enabled: boolean;
  seasonEndDay: number;
  newSeasonStartDay: number;
  zipArchiveDay: number;
  denyThreshold?: number;
  lastArchivedSeason?: LastArchivedSeason;
  transitionHistory?: SeasonTransitionLog[];
  /** Seasons an admin unarchived; the scheduler must not auto-archive them again. */
  autoArchiveSkips?: SeasonRef[];
}

export const DEFAULT_SEASON_AUTOMATION: SeasonAutomationConfig = {
  enabled: true,
  seasonEndDay: 20,
  newSeasonStartDay: 21,
  zipArchiveDay: 25,
  transitionHistory: [],
};

export const adminConfig = pgTable('admin_config', {
  _id: text('id').primaryKey().default(CONFIG_ROW_ID),
  denyThreshold: integer('deny_threshold').notNull().default(5),
  clipChannelIds: text('clip_channel_ids').array().notNull().default([]),
  blacklistedSubmitters: jsonb('blacklisted_submitters')
    .$type<BlacklistedSubmitter[]>()
    .notNull()
    .default([]),
  blacklistedStreamers: text('blacklisted_streamers').array().notNull().default([]),
  seasonAutomation: jsonb('season_automation')
    .$type<SeasonAutomationConfig>()
    .notNull()
    .default(DEFAULT_SEASON_AUTOMATION),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const clipsRelations = relations(clips, ({ many }) => ({
  comments: many(clipComments),
}));

export const clipCommentsRelations = relations(clipComments, ({ one, many }) => ({
  clip: one(clips, { fields: [clipComments.clipId], references: [clips._id] }),
  replies: many(clipCommentReplies),
}));

export const clipCommentRepliesRelations = relations(clipCommentReplies, ({ one }) => ({
  comment: one(clipComments, {
    fields: [clipCommentReplies.commentId],
    references: [clipComments._id],
  }),
}));

export const reportsRelations = relations(reports, ({ many }) => ({
  messages: many(reportMessages),
}));

export const reportMessagesRelations = relations(reportMessages, ({ one, many }) => ({
  report: one(reports, { fields: [reportMessages.reportId], references: [reports._id] }),
  readBy: many(reportMessageReads),
}));

export const reportMessageReadsRelations = relations(reportMessageReads, ({ one }) => ({
  message: one(reportMessages, {
    fields: [reportMessageReads.messageId],
    references: [reportMessages._id],
  }),
}));

export type UserRow = typeof users.$inferSelect;
export type ClipRow = typeof clips.$inferSelect;
export type NewClipRow = typeof clips.$inferInsert;
export type ClipRatingRow = typeof clipRatings.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
export type ZipRow = typeof zips.$inferSelect;
export type AdminConfigRow = typeof adminConfig.$inferSelect;
export type PublicConfigRow = typeof publicConfig.$inferSelect;
