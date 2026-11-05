import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  arrayOverlaps,
  isNotNull,
  ne,
  sql,
  type Column,
  type SQL,
} from 'drizzle-orm';
import { getCurrentSeason, parseSeason } from '@/lib/seasonHelpers';
import type { DecodedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  adminConfig,
  clipComments,
  clipCommentReplies,
  clipRatings,
  clips,
  CONFIG_ROW_ID,
  messages,
  DEFAULT_SEASON_AUTOMATION,
  notifications,
  publicConfig,
  RATING_VALUES,
  reportMessageReads,
  reportMessages,
  users,
  type AdminConfigRow,
  type MessageRow,
  type NewNotificationRow,
  type PublicConfigRow,
  type RatingValue,
  type SeasonAutomationConfig,
  type SeasonTransitionLog,
  type UserRole,
  type UserRow,
  USER_ROLES,
} from '@/db/schema';

/** Max entries kept in `seasonAutomation.transitionHistory`. */
const TRANSITION_HISTORY_LIMIT = 50;

/**
 * Recounts active (non-archived) clips and stores the total in the public config.
 *
 * @example
 * const activeClips = await refreshClipCount();
 */
export async function refreshClipCount(): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(clips)
    .where(eq(clips.archived, false));
  await db
    .insert(publicConfig)
    .values({ clipAmount: total })
    .onConflictDoUpdate({ target: publicConfig._id, set: { clipAmount: total } });
  return total;
}

/**
 * Returns the public config row, creating it with defaults when missing.
 *
 * @example
 * const { latestVideoLink } = await getPublicConfig();
 */
export async function getPublicConfig(): Promise<PublicConfigRow> {
  const existing = await db.query.publicConfig.findFirst();
  if (existing) return existing;
  await db.insert(publicConfig).values({}).onConflictDoNothing();
  const created = await db.query.publicConfig.findFirst();
  if (!created) throw new Error('Failed to create public config');
  return created;
}

/**
 * Returns the admin config row, creating it with defaults when missing.
 *
 * @example
 * const { denyThreshold } = await getAdminConfig();
 */
export async function getAdminConfig(): Promise<AdminConfigRow> {
  const existing = await db.query.adminConfig.findFirst();
  if (existing) return existing;
  await db.insert(adminConfig).values({}).onConflictDoNothing();
  const created = await db.query.adminConfig.findFirst();
  if (!created) throw new Error('Failed to create admin config');
  return created;
}

/**
 * Atomically read-modify-writes `adminConfig.seasonAutomation` (row-locked, so concurrent
 * jobs can't drop each other's history entries).
 *
 * @example
 * await updateSeasonAutomation((sa) => ({ ...sa, enabled: false }));
 */
export async function updateSeasonAutomation(
  update: (current: SeasonAutomationConfig) => SeasonAutomationConfig
): Promise<SeasonAutomationConfig> {
  await getAdminConfig();
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ seasonAutomation: adminConfig.seasonAutomation })
      .from(adminConfig)
      .where(eq(adminConfig._id, CONFIG_ROW_ID))
      .for('update');
    const next = update({ ...DEFAULT_SEASON_AUTOMATION, ...row?.seasonAutomation });
    await tx
      .update(adminConfig)
      .set({ seasonAutomation: next })
      .where(eq(adminConfig._id, CONFIG_ROW_ID));
    return next;
  });
}

/**
 * Prepends a season transition entry, keeping the newest {@link TRANSITION_HISTORY_LIMIT}.
 *
 * @example
 * await logSeasonTransition({ action: 'auto_zip_started', season: 'Fall', year: 2026, details: '...' });
 */
export async function logSeasonTransition(
  entry: Omit<SeasonTransitionLog, 'timestamp'>,
  update: (current: SeasonAutomationConfig) => SeasonAutomationConfig = (sa) => sa
): Promise<void> {
  await updateSeasonAutomation((current) => {
    const next = update(current);
    return {
      ...next,
      transitionHistory: [
        { ...entry, timestamp: new Date().toISOString() },
        ...(next.transitionHistory ?? []),
      ].slice(0, TRANSITION_HISTORY_LIMIT),
    };
  });
}

/**
 * Loads a clip with its comments and their replies (oldest first), or `undefined`.
 *
 * @example
 * const clip = await getClipWithComments(id);
 * clip?.comments[0]?.replies;
 */
export async function getClipWithComments(id: string) {
  return db.query.clips.findFirst({
    where: eq(clips._id, id),
    with: {
      comments: {
        orderBy: asc(clipComments.createdAt),
        with: { replies: { orderBy: asc(clipCommentReplies.createdAt) } },
      },
    },
  });
}

export type ClipWithComments = NonNullable<Awaited<ReturnType<typeof getClipWithComments>>>;

export interface RatingEntry {
  userId: string;
  username: string;
  timestamp: Date;
}

export type RatingBuckets = Record<RatingValue, RatingEntry[]>;

/** Per-clip rating summary in the bucketed shape the frontend consumes. */
export interface RatingDoc {
  clipId: string;
  ratings: RatingBuckets;
  /** Earliest rating on the clip. */
  createdAt: Date;
}

/**
 * Returns empty rating buckets.
 *
 * @example
 * emptyRatingBuckets().deny; // []
 */
export function emptyRatingBuckets(): RatingBuckets {
  return { '1': [], '2': [], '3': [], '4': [], deny: [] };
}

/**
 * Groups rating rows into one {@link RatingDoc} per clip. Pass `clipIds` to restrict
 * the lookup, or omit it to load every rating.
 *
 * @example
 * const docs = await getRatingDocs(['6720f3a1c4e9b2d87a1f0e53']);
 * docs.get('6720f3a1c4e9b2d87a1f0e53')?.ratings.deny.length;
 */
export async function getRatingDocs(clipIds?: string[]): Promise<Map<string, RatingDoc>> {
  if (clipIds && clipIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(clipRatings)
    .where(clipIds ? inArray(clipRatings.clipId, clipIds) : undefined)
    .orderBy(asc(clipRatings.timestamp));

  const docs = new Map<string, RatingDoc>();
  for (const row of rows) {
    let doc = docs.get(row.clipId);
    if (!doc) {
      doc = { clipId: row.clipId, ratings: emptyRatingBuckets(), createdAt: row.timestamp };
      docs.set(row.clipId, doc);
    }
    doc.ratings[row.rating].push({
      userId: row.userId,
      username: row.username,
      timestamp: row.timestamp,
    });
  }
  return docs;
}

/**
 * Narrows an arbitrary string to a rating bucket key.
 *
 * @example
 * isRatingValue('deny'); // true
 * isRatingValue('5'); // false
 */
export function isRatingValue(value: string): value is RatingValue {
  return RATING_VALUES.some((v) => v === value);
}

/**
 * Case-insensitive "contains" match with LIKE wildcards in `value` escaped, replacing the
 * old escaped-regex `$regex` filters.
 *
 * @example
 * db.select().from(clips).where(ilikeContains(clips.streamer, '50%_off'));
 */
export function ilikeContains(column: Column, value: string): SQL {
  return ilike(column, `%${value.replace(/[\\%_]/g, '\\$&')}%`);
}

/** A user row without the password hash, safe to send to clients. */
export type PublicUser = Omit<UserRow, 'password'>;

/**
 * Strips the password hash from a user row.
 *
 * @example
 * return NextResponse.json(toPublicUser(user));
 */
export function toPublicUser(user: UserRow): PublicUser {
  const { password: _password, ...rest } = user;
  return rest;
}

/** Column selection for user queries that must never include the password hash. */
export const publicUserColumns = {
  _id: users._id,
  username: users.username,
  email: users.email,
  profilePicture: users.profilePicture,
  roles: users.roles,
  status: users.status,
  discordId: users.discordId,
  discordUsername: users.discordUsername,
  ccId: users.ccId,
  ccUsername: users.ccUsername,
  joinDate: users.joinDate,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

/**
 * Ids of users having any of `roles`, optionally excluding one user.
 *
 * @example
 * const adminIds = await getUserIdsWithRoles(['admin']);
 */
export async function getUserIdsWithRoles(
  roles: UserRole[],
  excludeUserId?: string
): Promise<string[]> {
  const rows = await db
    .select({ _id: users._id })
    .from(users)
    .where(
      and(
        arrayOverlaps(users.roles, roles),
        excludeUserId ? ne(users._id, excludeUserId) : undefined
      )
    );
  return rows.map((r) => r._id);
}

/**
 * Inserts notifications in one statement (no-op for an empty list).
 *
 * @example
 * await createNotifications(adminIds.map((recipientId) => ({ recipientId, ... })));
 */
export async function createNotifications(rows: NewNotificationRow[]): Promise<void> {
  if (rows.length === 0) return;
  await db.insert(notifications).values(rows);
}

/**
 * Messages of a report, oldest first, each with its `readBy` list. Internal (admin-only)
 * messages are left out unless `includeInternal` is set.
 *
 * @example
 * const thread = await getReportMessages(reportId, user.roles.includes('admin'));
 */
export async function getReportMessages(reportId: string, includeInternal: boolean) {
  return db.query.reportMessages.findMany({
    where: and(
      eq(reportMessages.reportId, reportId),
      includeInternal ? undefined : eq(reportMessages.isInternal, false)
    ),
    orderBy: asc(reportMessages.createdAt),
    with: {
      readBy: {
        columns: { userId: true, username: true, readAt: true },
        orderBy: asc(reportMessageReads.readAt),
      },
    },
  });
}

/**
 * Adds a message to a report thread, marked as read by its sender, and returns it with `readBy`.
 *
 * @example
 * const message = await createReportMessage({ reportId, senderId, senderUsername, senderRole: 'admin', message: 'Hi', isInternal: false });
 */
export async function createReportMessage(values: typeof reportMessages.$inferInsert) {
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(reportMessages).values(values).returning();
    const [read] = await tx
      .insert(reportMessageReads)
      .values({ messageId: created._id, userId: values.senderId, username: values.senderUsername })
      .returning({
        userId: reportMessageReads.userId,
        username: reportMessageReads.username,
        readAt: reportMessageReads.readAt,
      });
    return { ...created, readBy: [read] };
  });
}

/**
 * Keeps the known roles from untrusted input; `undefined` when the input isn't a non-empty
 * array of known roles.
 *
 * @example
 * parseRoles(['admin', 'bogus']); // ['admin']
 * parseRoles('admin'); // undefined
 */
export function parseRoles(input: unknown): UserRole[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const roles = USER_ROLES.filter((role) => input.includes(role));
  return roles.length > 0 ? roles : undefined;
}

export interface RatingActivity {
  userId: string;
  username: string;
  clipId: string;
  rating: number | 'deny';
  timestamp: Date;
  clipMetadata: {
    /** Lowercase season name. */
    season: string;
    year: string;
  };
}

/**
 * Flat list of individual ratings (oldest first) with each clip's season/year. Clips without
 * a season — or deleted clips, whose ratings are kept — get one inferred from the clip's upload
 * date or the clip's first rating.
 *
 * Without `userId`, a `season`/`year` filter only matches ratings on existing clips (as the
 * admin stats always did); with `userId`, ratings on deleted clips are included too.
 *
 * @example
 * const activities = await getRatingActivities({ season: 'fall', year: '2026' });
 */
export async function getRatingActivities(filter: {
  season?: string | null;
  year?: string | null;
  userId?: string;
}): Promise<RatingActivity[]> {
  const { season, year, userId } = filter;
  const restrictToExistingClips = !userId && Boolean(season || year);
  const seasonName = season ? parseSeason(season) : undefined;

  const rows = await db
    .select({
      clipId: clipRatings.clipId,
      userId: clipRatings.userId,
      username: clipRatings.username,
      rating: clipRatings.rating,
      timestamp: clipRatings.timestamp,
      clipSeason: clips.season,
      clipYear: clips.year,
      clipCreatedAt: clips.createdAt,
    })
    .from(clipRatings)
    .leftJoin(clips, eq(clips._id, clipRatings.clipId))
    .where(
      and(
        userId ? eq(clipRatings.userId, userId) : undefined,
        restrictToExistingClips ? isNotNull(clips._id) : undefined,
        restrictToExistingClips && season
          ? seasonName
            ? eq(clips.season, seasonName)
            : sql`false`
          : undefined,
        restrictToExistingClips && year ? eq(clips.year, parseInt(year, 10)) : undefined
      )
    )
    .orderBy(asc(clipRatings.timestamp));

  const firstRatingAt = new Map<string, Date>();
  for (const row of rows) {
    if (!firstRatingAt.has(row.clipId)) firstRatingAt.set(row.clipId, row.timestamp);
  }

  const activities: RatingActivity[] = [];
  for (const row of rows) {
    const inferred = getCurrentSeason(
      row.clipCreatedAt ?? firstRatingAt.get(row.clipId) ?? row.timestamp
    );
    const clipSeason = row.clipSeason ? row.clipSeason.toLowerCase() : inferred.season;
    const clipYear = String(row.clipYear ?? inferred.year);

    if ((season && clipSeason !== season.toLowerCase()) || (year && clipYear !== year)) {
      continue;
    }

    activities.push({
      userId: row.userId,
      username: row.username || 'Unknown',
      clipId: row.clipId,
      rating: row.rating === 'deny' ? 'deny' : parseInt(row.rating, 10),
      timestamp: row.timestamp,
      clipMetadata: { season: clipSeason, year: clipYear },
    });
  }
  return activities;
}

export interface UserRatingSummary {
  userId: string;
  username: string;
  totalRatings: number;
  ratings: Array<Omit<RatingActivity, 'userId' | 'username'>>;
}

/**
 * Groups rating activities per user, most active user first.
 *
 * @example
 * const leaderboard = groupRatingActivitiesByUser(await getRatingActivities({}));
 */
export function groupRatingActivitiesByUser(activities: RatingActivity[]): UserRatingSummary[] {
  const byUser = new Map<string, UserRatingSummary>();
  for (const { userId, username, ...rating } of activities) {
    let summary = byUser.get(userId);
    if (!summary) {
      summary = { userId, username, totalRatings: 0, ratings: [] };
      byUser.set(userId, summary);
    }
    summary.ratings.push(rating);
    summary.totalRatings++;
  }
  return Array.from(byUser.values()).sort((a, b) => b.totalRatings - a.totalRatings);
}

/**
 * Saves a team chat message on a clip and notifies the other clip team members and admins.
 * Notification failures are logged, not thrown, so the message is never lost.
 *
 * @example
 * const message = await createTeamMessage({ clipId, message: 'Nice one', profilePicture: '', author: user });
 */
export async function createTeamMessage(input: {
  clipId: string;
  message: string;
  profilePicture: string;
  author: DecodedUser;
}): Promise<MessageRow> {
  const { clipId, message, profilePicture, author } = input;
  const [newMessage] = await db
    .insert(messages)
    .values({
      clipId,
      userId: author.id,
      user: author.username,
      message: message.trim(),
      profilePicture,
    })
    .returning();

  try {
    const [recipientIds, [clipInfo]] = await Promise.all([
      getUserIdsWithRoles(['clipteam', 'admin'], author.id),
      db
        .select({ title: clips.title, streamer: clips.streamer })
        .from(clips)
        .where(eq(clips._id, clipId)),
    ]);
    const clipTitle = clipInfo ? clipInfo.title : 'a clip';
    const clipStreamer = clipInfo ? clipInfo.streamer : '';
    const notificationMessage = `${author.username} posted a team message on ${clipStreamer}'s clip: "${clipTitle}"`;

    await createNotifications(
      recipientIds.map((recipientId) => ({
        recipientId,
        senderId: author.id,
        senderUsername: author.username,
        type: 'team_message' as const,
        entityId: newMessage._id,
        clipId,
        message: notificationMessage,
      }))
    );
  } catch (notifErr) {
    console.error('Error creating notifications for team message:', notifErr);
  }

  return newMessage;
}

/**
 * Deletes a team chat message if `user` is its author or an admin.
 *
 * @example
 * const result = await deleteTeamMessage(messageId, user);
 * if (typeof result === 'object') emitDeleted(result.clipId);
 */
export async function deleteTeamMessage(
  messageId: string,
  user: DecodedUser
): Promise<{ clipId: string } | 'not_found' | 'forbidden'> {
  const [message] = await db
    .select({ clipId: messages.clipId, userId: messages.userId })
    .from(messages)
    .where(eq(messages._id, messageId));
  if (!message) return 'not_found';
  if (!user.roles.includes('admin') && message.userId !== user.id) return 'forbidden';

  await db.delete(messages).where(eq(messages._id, messageId));
  return { clipId: message.clipId };
}
