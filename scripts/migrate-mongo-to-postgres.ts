/**
 * One-time copy of all ClipSesh data from MongoDB into Postgres.
 *
 * Postgres ends up as an exact copy of MongoDB: the whole import runs in a single transaction
 * that first empties every table, so a failure leaves Postgres untouched and the script can be
 * re-run as often as needed (e.g. a rehearsal now, the real cut-over later).
 *
 * Usage:
 *   MONGODB_URI=mongodb://... DATABASE_URL=postgres://... npm run db:migrate-mongo -- [--dry-run] [--yes]
 *
 *   --dry-run  Import everything, print the report, then roll back (validates all constraints).
 *   --yes      Allow wiping a Postgres database that already contains data.
 *
 * Ids are preserved (ObjectId hex strings), so clip links, JWTs and notification targets keep
 * working. Rows whose required parent is missing (e.g. votes on deleted clips) are skipped and
 * listed in the report; ratings, reports, messages and notifications of deleted clips/users are
 * kept, as the app never removed them either.
 */
import 'dotenv/config';
import { MongoClient, ObjectId, type Db, type Document } from 'mongodb';
import { count, getTableName, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { connectToDatabase, closeDatabase, db } from '../src/lib/db';
import {
  adminConfig,
  clipCommentReplies,
  clipComments,
  clipRatings,
  clips,
  clipViews,
  CONFIG_ROW_ID,
  DEFAULT_SEASON_AUTOMATION,
  messages,
  notifications,
  NOTIFICATION_TYPES,
  publicConfig,
  RATING_VALUES,
  reportMessageReads,
  reportMessages,
  reports,
  REPORT_STATUSES,
  SEASONS,
  users,
  USER_ROLES,
  votes,
  zips,
  type LastArchivedSeason,
  type SeasonAutomationConfig,
  type SeasonTransitionLog,
} from '../src/db/schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const BATCH_SIZE = 500;
const MIGRATED_COLLECTIONS = new Set([
  'users',
  'clips',
  'ratings',
  'votes',
  'ipvotes',
  'clipviews',
  'messages',
  'notifications',
  'reports',
  'reportmessages',
  'zips',
  'publicconfigs',
  'adminconfigs',
]);

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const allowWipe = args.has('--yes');

class DryRunRollback extends Error {}

interface TableReport {
  source: number;
  inserted: number;
  skipped: Map<string, number>;
}

const report = new Map<string, TableReport>();

function tableReport(name: string): TableReport {
  let entry = report.get(name);
  if (!entry) {
    entry = { source: 0, inserted: 0, skipped: new Map() };
    report.set(name, entry);
  }
  return entry;
}

function skip(table: string, reason: string): void {
  const entry = tableReport(table);
  entry.skipped.set(reason, (entry.skipped.get(reason) ?? 0) + 1);
}

// ---------- value coercion ----------

/** ObjectId / string → trimmed string, anything else → undefined. */
function str(value: unknown): string | undefined {
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
}

/** Like {@link str}, but empty strings become null (for nullable/unique columns). */
function optStr(value: unknown): string | null {
  return str(value) || null;
}

function date(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
}

function num(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : {};
}

function oneOf<T extends string>(options: readonly T[], value: unknown): T | undefined {
  const s = str(value);
  return options.find((o) => o === s);
}

function season(value: unknown) {
  const s = str(value)?.toLowerCase();
  return SEASONS.find((name) => name.toLowerCase() === s);
}

/** Document id as hex, plus the creation time encoded in ObjectIds (fallback for createdAt). */
function idOf(doc: Document): { id: string; idTime: Date } {
  const raw = doc._id;
  if (raw instanceof ObjectId) return { id: raw.toHexString(), idTime: raw.getTimestamp() };
  const id = str(raw) ?? new ObjectId().toHexString();
  return { id, idTime: new Date() };
}

// ---------- batching ----------

async function insertBatched<T extends PgTable>(
  tx: Tx,
  table: T,
  rows: T['$inferInsert'][]
): Promise<void> {
  const name = getTableName(table);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await tx.insert(table).values(rows.slice(i, i + BATCH_SIZE));
  }
  tableReport(name).inserted += rows.length;
}

async function readAll(mongo: Db, collection: string, table: string): Promise<Document[]> {
  const docs = await mongo.collection(collection).find().toArray();
  tableReport(table).source += docs.length;
  return docs;
}

/** Keeps the first row per key; later duplicates are reported as skipped. */
function dedupe<T>(table: string, rows: T[], key: (row: T) => string, reason: string): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const k = key(row);
    if (seen.has(k)) {
      skip(table, reason);
      return false;
    }
    seen.add(k);
    return true;
  });
}

// ---------- collections ----------

async function migrateUsers(mongo: Db, tx: Tx): Promise<void> {
  const docs = await readAll(mongo, 'users', 'users');
  const rows: (typeof users.$inferInsert)[] = [];
  for (const doc of docs) {
    const { id, idTime } = idOf(doc);
    const username = str(doc.username);
    if (!username) {
      skip('users', 'missing username');
      continue;
    }
    const roles = USER_ROLES.filter((role) => arr(doc.roles).includes(role));
    const createdAt = date(doc.createdAt) ?? date(doc.joinDate) ?? idTime;
    rows.push({
      _id: id,
      username,
      email: optStr(doc.email)?.toLowerCase() ?? null,
      password: str(doc.password) ?? '',
      profilePicture: str(doc.profilePicture) || '/profilePictures/profile_placeholder.png',
      roles: roles.length > 0 ? roles : ['user'],
      status: oneOf(['active', 'disabled'] as const, doc.status) ?? 'active',
      discordId: optStr(doc.discordId),
      discordUsername: optStr(doc.discordUsername),
      ccId: optStr(doc.ccId),
      ccUsername: optStr(doc.ccUsername),
      joinDate: date(doc.joinDate) ?? createdAt,
      createdAt,
      updatedAt: date(doc.updatedAt) ?? createdAt,
    });
  }
  // Unique columns: a later duplicate keeps its account but loses the clashing value.
  const seenEmail = new Set<string>();
  const seenDiscord = new Set<string>();
  const seenCc = new Set<string>();
  for (const row of rows) {
    if (row.email && seenEmail.has(row.email)) {
      skip('users', `duplicate email cleared on ${row.username}`);
      row.email = null;
    }
    if (row.discordId && seenDiscord.has(row.discordId)) {
      skip('users', `duplicate discordId cleared on ${row.username}`);
      row.discordId = null;
    }
    if (row.ccId && seenCc.has(row.ccId)) {
      skip('users', `duplicate ccId cleared on ${row.username}`);
      row.ccId = null;
    }
    if (row.email) seenEmail.add(row.email);
    if (row.discordId) seenDiscord.add(row.discordId);
    if (row.ccId) seenCc.add(row.ccId);
  }
  await insertBatched(tx, users, dedupe('users', rows, (r) => r.username, 'duplicate username'));
}

async function migrateClips(mongo: Db, tx: Tx): Promise<Set<string>> {
  const docs = await readAll(mongo, 'clips', 'clips');
  const clipRows: (typeof clips.$inferInsert)[] = [];
  const commentRows: (typeof clipComments.$inferInsert)[] = [];
  const replyRows: (typeof clipCommentReplies.$inferInsert)[] = [];

  for (const doc of docs) {
    const { id, idTime } = idOf(doc);
    const url = str(doc.url);
    if (!url) {
      skip('clips', 'missing url');
      continue;
    }
    const createdAt = date(doc.createdAt) ?? idTime;
    clipRows.push({
      _id: id,
      link: optStr(doc.link),
      url,
      thumbnail: optStr(doc.thumbnail),
      streamer: str(doc.streamer) ?? '',
      submitter: str(doc.submitter) ?? '',
      title: str(doc.title) ?? 'Untitled Clip',
      upvotes: Math.max(0, num(doc.upvotes) ?? 0),
      downvotes: Math.max(0, num(doc.downvotes) ?? 0),
      views: Math.max(0, num(doc.views) ?? 0),
      discordSubmitterId: optStr(doc.discordSubmitterId),
      season: season(doc.season) ?? null,
      year: num(doc.year) ?? null,
      archived: doc.archived === true,
      archivedAt: date(doc.archivedAt) ?? null,
      createdAt,
      updatedAt: date(doc.updatedAt) ?? createdAt,
    });

    for (const rawComment of arr(doc.comments)) {
      const comment = record(rawComment);
      tableReport('clip_comments').source++;
      const commentId = str(comment._id) ?? new ObjectId().toHexString();
      const userId = str(comment.userId);
      const text = str(comment.comment);
      if (!userId || !text) {
        skip('clip_comments', 'missing userId or text');
        continue;
      }
      commentRows.push({
        _id: commentId,
        clipId: id,
        userId,
        username: str(comment.username) ?? '',
        comment: text,
        createdAt: date(comment.createdAt) ?? createdAt,
      });
      for (const rawReply of arr(comment.replies)) {
        const reply = record(rawReply);
        tableReport('clip_comment_replies').source++;
        const replyUserId = str(reply.userId);
        const replyText = str(reply.replyText);
        if (!replyUserId || !replyText) {
          skip('clip_comment_replies', 'missing userId or text');
          continue;
        }
        replyRows.push({
          _id: str(reply._id) ?? new ObjectId().toHexString(),
          commentId,
          userId: replyUserId,
          username: str(reply.username) ?? '',
          replyText,
          createdAt: date(reply.createdAt) ?? createdAt,
        });
      }
    }
  }

  const uniqueClips = dedupe('clips', clipRows, (r) => r._id ?? '', 'duplicate id');
  await insertBatched(tx, clips, uniqueClips);
  await insertBatched(tx, clipComments, dedupe('clip_comments', commentRows, (r) => r._id ?? '', 'duplicate id'));
  await insertBatched(tx, clipCommentReplies, dedupe('clip_comment_replies', replyRows, (r) => r._id ?? '', 'duplicate id'));
  return new Set(uniqueClips.map((c) => c._id ?? ''));
}

async function migrateRatings(mongo: Db, tx: Tx): Promise<void> {
  const docs = await mongo.collection('ratings').find().toArray();
  const byClipUser = new Map<string, typeof clipRatings.$inferInsert>();
  for (const doc of docs) {
    const { idTime } = idOf(doc);
    const clipId = str(doc.clipId);
    const buckets = record(doc.ratings);
    for (const rating of RATING_VALUES) {
      for (const rawEntry of arr(buckets[rating])) {
        const entry = record(rawEntry);
        tableReport('clip_ratings').source++;
        const userId = str(entry.userId);
        if (!clipId || !userId) {
          skip('clip_ratings', 'missing clipId or userId');
          continue;
        }
        const row = {
          clipId,
          userId,
          username: str(entry.username) ?? '',
          rating,
          timestamp: date(entry.timestamp) ?? date(doc.createdAt) ?? idTime,
        };
        const key = `${clipId}:${userId}`;
        const existing = byClipUser.get(key);
        if (existing) {
          // A user can only hold one rating per clip; keep their most recent one.
          skip('clip_ratings', 'user rated the same clip twice (kept latest)');
          if (existing.timestamp && row.timestamp <= existing.timestamp) continue;
        }
        byClipUser.set(key, row);
      }
    }
  }
  await insertBatched(tx, clipRatings, Array.from(byClipUser.values()));
}

async function migrateVotes(mongo: Db, tx: Tx, clipIds: Set<string>): Promise<void> {
  const rows: (typeof votes.$inferInsert)[] = [];
  const collect = (doc: Document, voterToken: string | undefined) => {
    const { idTime } = idOf(doc);
    const clipId = str(doc.clipId);
    const vote = oneOf(['upvote', 'downvote'] as const, doc.vote);
    if (!clipId || !voterToken || !vote) {
      skip('votes', 'missing clipId, voter or vote');
      return;
    }
    if (!clipIds.has(clipId)) {
      skip('votes', 'clip no longer exists');
      return;
    }
    const createdAt = date(doc.createdAt) ?? idTime;
    rows.push({ clipId, voterToken, vote, createdAt, updatedAt: date(doc.updatedAt) ?? createdAt });
  };

  for (const doc of await readAll(mongo, 'votes', 'votes')) {
    collect(doc, str(doc.voterToken));
  }
  // Legacy IP-based votes predate voter cookies; keep them as history under a synthetic token.
  for (const doc of await readAll(mongo, 'ipvotes', 'votes')) {
    const ip = str(doc.ip);
    collect(doc, ip ? `legacy-ip:${ip}` : undefined);
  }
  await insertBatched(tx, votes, dedupe('votes', rows, (r) => `${r.clipId}:${r.voterToken}`, 'duplicate vote'));
}

async function migrateClipViews(mongo: Db, tx: Tx, clipIds: Set<string>): Promise<void> {
  const rows: (typeof clipViews.$inferInsert)[] = [];
  for (const doc of await readAll(mongo, 'clipviews', 'clip_views')) {
    const clipId = str(doc.clipId);
    const ip = str(doc.ip);
    if (!clipId || !ip || !clipIds.has(clipId)) {
      skip('clip_views', 'missing or deleted clip');
      continue;
    }
    rows.push({ clipId, ip, createdAt: date(doc.createdAt) ?? idOf(doc).idTime });
  }
  await insertBatched(tx, clipViews, dedupe('clip_views', rows, (r) => `${r.clipId}:${r.ip}`, 'duplicate view'));
}

async function migrateMessages(mongo: Db, tx: Tx): Promise<void> {
  const rows: (typeof messages.$inferInsert)[] = [];
  for (const doc of await readAll(mongo, 'messages', 'messages')) {
    const { id, idTime } = idOf(doc);
    const clipId = str(doc.clipId);
    const message = str(doc.message);
    if (!clipId || !message) {
      skip('messages', 'missing clipId or text');
      continue;
    }
    const timestamp = date(doc.timestamp) ?? date(doc.createdAt) ?? idTime;
    const createdAt = date(doc.createdAt) ?? timestamp;
    rows.push({
      _id: id,
      clipId,
      userId: optStr(doc.userId),
      user: str(doc.user) ?? '',
      message,
      profilePicture: str(doc.profilePicture) ?? '',
      timestamp,
      createdAt,
      updatedAt: date(doc.updatedAt) ?? createdAt,
    });
  }
  await insertBatched(tx, messages, rows);
}

async function migrateNotifications(mongo: Db, tx: Tx): Promise<void> {
  const rows: (typeof notifications.$inferInsert)[] = [];
  for (const doc of await readAll(mongo, 'notifications', 'notifications')) {
    const { id, idTime } = idOf(doc);
    const recipientId = str(doc.recipientId);
    const senderId = str(doc.senderId);
    const type = oneOf(NOTIFICATION_TYPES, doc.type);
    if (!recipientId || !senderId || !type) {
      skip('notifications', 'missing recipient, sender or known type');
      continue;
    }
    const createdAt = date(doc.createdAt) ?? idTime;
    rows.push({
      _id: id,
      recipientId,
      senderId,
      senderUsername: str(doc.senderUsername) ?? '',
      type,
      entityId: optStr(doc.entityId),
      replyId: optStr(doc.replyId),
      clipId: optStr(doc.clipId),
      read: doc.read === true,
      message: str(doc.message) ?? '',
      createdAt,
      updatedAt: date(doc.updatedAt) ?? createdAt,
    });
  }
  await insertBatched(tx, notifications, rows);
}

async function migrateReports(mongo: Db, tx: Tx): Promise<void> {
  const reportRows: (typeof reports.$inferInsert)[] = [];
  for (const doc of await readAll(mongo, 'reports', 'reports')) {
    const { id, idTime } = idOf(doc);
    const clipId = str(doc.clipId);
    const reporterId = str(doc.reporterId);
    if (!clipId || !reporterId) {
      skip('reports', 'missing clipId or reporterId');
      continue;
    }
    const createdAt = date(doc.createdAt) ?? idTime;
    reportRows.push({
      _id: id,
      clipId,
      clipTitle: str(doc.clipTitle) ?? '',
      clipStreamer: str(doc.clipStreamer) ?? '',
      clipSubmitter: str(doc.clipSubmitter) ?? '',
      reporterId,
      reporterUsername: str(doc.reporterUsername) ?? '',
      reason: str(doc.reason) ?? '',
      status: oneOf(REPORT_STATUSES, doc.status) ?? 'pending',
      reviewedBy: optStr(doc.reviewedBy),
      reviewedAt: date(doc.reviewedAt) ?? null,
      adminNotes: str(doc.adminNotes) ?? '',
      createdAt,
      updatedAt: date(doc.updatedAt) ?? createdAt,
    });
  }
  await insertBatched(tx, reports, reportRows);
  const reportIds = new Set(reportRows.map((r) => r._id));

  const messageRows: (typeof reportMessages.$inferInsert)[] = [];
  const readRows: (typeof reportMessageReads.$inferInsert)[] = [];
  for (const doc of await readAll(mongo, 'reportmessages', 'report_messages')) {
    const { id, idTime } = idOf(doc);
    const reportId = str(doc.reportId);
    const senderId = str(doc.senderId);
    const senderRole = oneOf(['reporter', 'admin'] as const, doc.senderRole);
    if (!reportId || !reportIds.has(reportId)) {
      skip('report_messages', 'report no longer exists');
      continue;
    }
    if (!senderId || !senderRole) {
      skip('report_messages', 'missing sender');
      continue;
    }
    const createdAt = date(doc.createdAt) ?? idTime;
    messageRows.push({
      _id: id,
      reportId,
      senderId,
      senderUsername: str(doc.senderUsername) ?? '',
      senderRole,
      message: str(doc.message) ?? '',
      isInternal: doc.isInternal === true,
      createdAt,
      updatedAt: date(doc.updatedAt) ?? createdAt,
    });
    for (const rawRead of arr(doc.readBy)) {
      const read = record(rawRead);
      tableReport('report_message_reads').source++;
      const userId = str(read.userId);
      if (!userId) {
        skip('report_message_reads', 'missing userId');
        continue;
      }
      readRows.push({
        messageId: id,
        userId,
        username: str(read.username) ?? '',
        readAt: date(read.readAt) ?? createdAt,
      });
    }
  }
  await insertBatched(tx, reportMessages, messageRows);
  await insertBatched(
    tx,
    reportMessageReads,
    dedupe('report_message_reads', readRows, (r) => `${r.messageId}:${r.userId}`, 'duplicate read')
  );
}

async function migrateZips(mongo: Db, tx: Tx): Promise<void> {
  const rows: (typeof zips.$inferInsert)[] = [];
  for (const doc of await readAll(mongo, 'zips', 'zips')) {
    const { id, idTime } = idOf(doc);
    const zipSeason = season(doc.season);
    const year = num(doc.year);
    const name = str(doc.name);
    if (!zipSeason || year === undefined || !name) {
      skip('zips', 'missing season, year or name');
      continue;
    }
    const createdAt = date(doc.createdAt) ?? idTime;
    rows.push({
      _id: id,
      name,
      url: str(doc.url) ?? `/download/${name}`,
      season: zipSeason,
      year,
      clipAmount: num(doc.clipAmount) ?? 0,
      size: num(doc.size) ?? 0,
      createdAt,
      updatedAt: date(doc.updatedAt) ?? createdAt,
    });
  }
  await insertBatched(tx, zips, rows);
}

function seasonAutomationFrom(value: unknown): SeasonAutomationConfig {
  const raw = record(value);
  const result: SeasonAutomationConfig = { ...DEFAULT_SEASON_AUTOMATION };
  if (typeof raw.enabled === 'boolean') result.enabled = raw.enabled;
  result.seasonEndDay = num(raw.seasonEndDay) ?? result.seasonEndDay;
  result.newSeasonStartDay = num(raw.newSeasonStartDay) ?? result.newSeasonStartDay;
  result.zipArchiveDay = num(raw.zipArchiveDay) ?? result.zipArchiveDay;
  const denyThreshold = num(raw.denyThreshold);
  if (denyThreshold !== undefined) result.denyThreshold = denyThreshold;

  const last = record(raw.lastArchivedSeason);
  const lastSeason = season(last.season);
  const lastYear = num(last.year);
  if (lastSeason && lastYear !== undefined) {
    const lastArchived: LastArchivedSeason = {
      season: lastSeason,
      year: lastYear,
      archivedAt: (date(last.archivedAt) ?? new Date()).toISOString(),
      clipCount: num(last.clipCount) ?? 0,
      status: oneOf(['success', 'failed'] as const, last.status) ?? 'success',
    };
    const jobId = str(last.jobId);
    if (jobId) lastArchived.jobId = jobId;
    const zipUrl = str(last.zipUrl);
    if (zipUrl) lastArchived.zipUrl = zipUrl;
    const error = str(last.error);
    if (error) lastArchived.error = error;
    result.lastArchivedSeason = lastArchived;
  }

  const actions = [
    'submission_closed',
    'season_started',
    'auto_zip_started',
    'auto_zip_completed',
    'auto_zip_failed',
    'season_unarchived',
  ] as const;
  result.transitionHistory = arr(raw.transitionHistory).flatMap((rawEntry): SeasonTransitionLog[] => {
    const entry = record(rawEntry);
    const action = oneOf(actions, entry.action);
    const entrySeason = season(entry.season);
    const year = num(entry.year);
    if (!action || !entrySeason || year === undefined) return [];
    return [
      {
        timestamp: (date(entry.timestamp) ?? new Date()).toISOString(),
        action,
        season: entrySeason,
        year,
        details: str(entry.details) ?? '',
      },
    ];
  });

  result.autoArchiveSkips = arr(raw.autoArchiveSkips).flatMap((rawSkip) => {
    const skipEntry = record(rawSkip);
    const skipSeason = season(skipEntry.season);
    const year = num(skipEntry.year);
    return skipSeason && year !== undefined ? [{ season: skipSeason, year }] : [];
  });
  return result;
}

async function migrateConfig(mongo: Db, tx: Tx): Promise<void> {
  // The app always read the first document (findOne), so that's the one that counts.
  const publicDocs = await readAll(mongo, 'publicconfigs', 'public_config');
  const publicDoc = publicDocs[0];
  if (publicDocs.length > 1) skip('public_config', 'extra config documents ignored (app used the first)');
  if (publicDoc) {
    await insertBatched(tx, publicConfig, [
      {
        _id: CONFIG_ROW_ID,
        latestVideoLink: str(publicDoc.latestVideoLink) ?? '',
        clipAmount: num(publicDoc.clipAmount) ?? 0,
        createdAt: date(publicDoc.createdAt) ?? idOf(publicDoc).idTime,
      },
    ]);
  }

  const adminDocs = await readAll(mongo, 'adminconfigs', 'admin_config');
  const adminDoc = adminDocs[0];
  if (adminDocs.length > 1) skip('admin_config', 'extra config documents ignored (app used the first)');
  if (adminDoc) {
    await insertBatched(tx, adminConfig, [
      {
        _id: CONFIG_ROW_ID,
        denyThreshold: Math.max(1, num(adminDoc.denyThreshold) ?? 5),
        clipChannelIds: arr(adminDoc.clipChannelIds).flatMap((v) => str(v) ?? []),
        blacklistedSubmitters: arr(adminDoc.blacklistedSubmitters).map((rawSubmitter) => {
          const submitter = record(rawSubmitter);
          return { username: str(submitter.username) ?? '', userId: str(submitter.userId) ?? '' };
        }),
        blacklistedStreamers: arr(adminDoc.blacklistedStreamers).flatMap((v) => str(v) ?? []),
        seasonAutomation: seasonAutomationFrom(adminDoc.seasonAutomation),
        createdAt: date(adminDoc.createdAt) ?? idOf(adminDoc).idTime,
      },
    ]);
  }
}

// ---------- main ----------

const ALL_TABLES: PgTable[] = [
  reportMessageReads,
  reportMessages,
  reports,
  clipCommentReplies,
  clipComments,
  clipRatings,
  votes,
  clipViews,
  messages,
  notifications,
  zips,
  clips,
  users,
  publicConfig,
  adminConfig,
];

async function verifyCounts(tx: Tx): Promise<string[]> {
  const mismatches: string[] = [];
  for (const table of ALL_TABLES) {
    const name = getTableName(table);
    const expected = report.get(name)?.inserted ?? 0;
    const [{ actual }] = await tx.select({ actual: count() }).from(table);
    if (actual !== expected) mismatches.push(`${name}: expected ${expected}, found ${actual}`);
  }
  return mismatches;
}

function printReport(mongoCollections: string[]): void {
  console.log('\nTable                    source  inserted  skipped');
  console.log('------------------------ ------- --------- -------');
  for (const [name, entry] of report) {
    const skipped = Array.from(entry.skipped.values()).reduce((a, b) => a + b, 0);
    console.log(
      `${name.padEnd(24)} ${String(entry.source).padStart(7)} ${String(entry.inserted).padStart(9)} ${String(skipped).padStart(7)}`
    );
    for (const [reason, n] of entry.skipped) {
      console.log(`  - ${n} × ${reason}`);
    }
  }
  const ignored = mongoCollections.filter((c) => !MIGRATED_COLLECTIONS.has(c) && !c.startsWith('system.'));
  if (ignored.length > 0) {
    console.log(`\nMongo collections not used by the app and not migrated: ${ignored.join(', ')}`);
  }
}

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('Set MONGODB_URI to the source MongoDB database');
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL to the target Postgres database');

  console.log('Applying Postgres migrations...');
  await connectToDatabase();

  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  const mongo = mongoClient.db();
  console.log(`Reading from MongoDB database "${mongo.databaseName}"${dryRun ? ' (dry run)' : ''}`);
  const mongoCollections = (await mongo.listCollections().toArray()).map((c) => c.name);

  try {
    await db.transaction(async (tx) => {
      const [[{ userCount }], [{ clipCount }]] = await Promise.all([
        tx.select({ userCount: count() }).from(users),
        tx.select({ clipCount: count() }).from(clips),
      ]);
      if (userCount + clipCount > 0 && !allowWipe && !dryRun) {
        throw new Error(
          'Postgres already contains users or clips. Re-run with --yes to replace them with the MongoDB data.'
        );
      }

      await tx.execute(
        sql.raw(`truncate table ${ALL_TABLES.map((t) => `"${getTableName(t)}"`).join(', ')} cascade`)
      );

      await migrateUsers(mongo, tx);
      const clipIds = await migrateClips(mongo, tx);
      await migrateRatings(mongo, tx);
      await migrateVotes(mongo, tx, clipIds);
      await migrateClipViews(mongo, tx, clipIds);
      await migrateMessages(mongo, tx);
      await migrateNotifications(mongo, tx);
      await migrateReports(mongo, tx);
      await migrateZips(mongo, tx);
      await migrateConfig(mongo, tx);

      const mismatches = await verifyCounts(tx);
      printReport(mongoCollections);
      if (mismatches.length > 0) {
        throw new Error(`Row count check failed:\n${mismatches.join('\n')}`);
      }
      if (dryRun) throw new DryRunRollback();
    });
    console.log('\nMigration committed. Postgres now mirrors MongoDB.');
  } catch (error) {
    if (error instanceof DryRunRollback) {
      console.log('\nDry run complete: all rows were valid; the transaction was rolled back.');
    } else {
      throw error;
    }
  } finally {
    await mongoClient.close();
    await closeDatabase();
  }
}

main().catch((error) => {
  console.error('\nMigration failed (Postgres left unchanged):', error);
  process.exit(1);
});
