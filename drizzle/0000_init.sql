CREATE TYPE "public"."notification_type" AS ENUM('comment_reply', 'mention', 'rating', 'system', 'team_message', 'report', 'report_update');--> statement-breakpoint
CREATE TYPE "public"."rating_value" AS ENUM('1', '2', '3', '4', 'deny');--> statement-breakpoint
CREATE TYPE "public"."report_sender_role" AS ENUM('reporter', 'admin');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewed', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('Spring', 'Summer', 'Fall', 'Winter');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."vote_type" AS ENUM('upvote', 'downvote');--> statement-breakpoint
CREATE TABLE "admin_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"deny_threshold" integer DEFAULT 5 NOT NULL,
	"clip_channel_ids" text[] DEFAULT '{}' NOT NULL,
	"blacklisted_submitters" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blacklisted_streamers" text[] DEFAULT '{}' NOT NULL,
	"season_automation" jsonb DEFAULT '{"enabled":true,"seasonEndDay":20,"newSeasonStartDay":21,"zipArchiveDay":25,"transitionHistory":[]}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clip_comment_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"comment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"reply_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clip_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"clip_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clip_ratings" (
	"clip_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"rating" "rating_value" NOT NULL,
	"rated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clip_ratings_clip_id_user_id_pk" PRIMARY KEY("clip_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "clip_views" (
	"clip_id" text NOT NULL,
	"ip" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clip_views_clip_id_ip_pk" PRIMARY KEY("clip_id","ip")
);
--> statement-breakpoint
CREATE TABLE "clips" (
	"id" text PRIMARY KEY NOT NULL,
	"link" text,
	"url" text NOT NULL,
	"thumbnail" text,
	"streamer" text NOT NULL,
	"submitter" text NOT NULL,
	"title" text NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"discord_submitter_id" text,
	"season" "season",
	"year" integer,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"clip_id" text NOT NULL,
	"user_id" text,
	"user" text NOT NULL,
	"message" text NOT NULL,
	"profile_picture" text DEFAULT '' NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"sender_username" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"entity_id" text,
	"reply_id" text,
	"clip_id" text,
	"read" boolean DEFAULT false NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"latest_video_link" text DEFAULT '' NOT NULL,
	"clip_amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_message_reads" (
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_message_reads_message_id_user_id_pk" PRIMARY KEY("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "report_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"sender_username" text NOT NULL,
	"sender_role" "report_sender_role" NOT NULL,
	"message" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"clip_id" text NOT NULL,
	"clip_title" text NOT NULL,
	"clip_streamer" text NOT NULL,
	"clip_submitter" text NOT NULL,
	"reporter_id" text NOT NULL,
	"reporter_username" text NOT NULL,
	"reason" text NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"admin_notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"password" text NOT NULL,
	"profile_picture" text DEFAULT '/profilePictures/profile_placeholder.png' NOT NULL,
	"roles" text[] DEFAULT '{"user"}' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"discord_id" text,
	"discord_username" text,
	"cc_id" text,
	"cc_username" text,
	"join_date" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id"),
	CONSTRAINT "users_cc_id_unique" UNIQUE("cc_id")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"clip_id" text NOT NULL,
	"voter_token" text NOT NULL,
	"vote" "vote_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_clip_id_voter_token_pk" PRIMARY KEY("clip_id","voter_token")
);
--> statement-breakpoint
CREATE TABLE "zips" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"season" "season" NOT NULL,
	"year" integer NOT NULL,
	"clip_amount" integer DEFAULT 0 NOT NULL,
	"size" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clip_comment_replies" ADD CONSTRAINT "clip_comment_replies_comment_id_clip_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."clip_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clip_comments" ADD CONSTRAINT "clip_comments_clip_id_clips_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clip_views" ADD CONSTRAINT "clip_views_clip_id_clips_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_message_reads" ADD CONSTRAINT "report_message_reads_message_id_report_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."report_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_messages" ADD CONSTRAINT "report_messages_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_clip_id_clips_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clip_comment_replies_comment_idx" ON "clip_comment_replies" USING btree ("comment_id","created_at");--> statement-breakpoint
CREATE INDEX "clip_comments_clip_idx" ON "clip_comments" USING btree ("clip_id","created_at");--> statement-breakpoint
CREATE INDEX "clip_ratings_user_idx" ON "clip_ratings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "clip_ratings_clip_rating_idx" ON "clip_ratings" USING btree ("clip_id","rating");--> statement-breakpoint
CREATE INDEX "clip_views_created_idx" ON "clip_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "clips_archived_created_idx" ON "clips" USING btree ("archived","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "clips_archived_upvotes_idx" ON "clips" USING btree ("archived","upvotes" DESC NULLS LAST,"created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "clips_archived_downvotes_idx" ON "clips" USING btree ("archived","downvotes" DESC NULLS LAST,"created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "clips_season_year_idx" ON "clips" USING btree ("season","year","archived");--> statement-breakpoint
CREATE INDEX "clips_streamer_idx" ON "clips" USING btree ("streamer");--> statement-breakpoint
CREATE INDEX "clips_link_idx" ON "clips" USING btree ("link");--> statement-breakpoint
CREATE INDEX "messages_clip_idx" ON "messages" USING btree ("clip_id","timestamp");--> statement-breakpoint
CREATE INDEX "notifications_recipient_created_idx" ON "notifications" USING btree ("recipient_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_recipient_read_idx" ON "notifications" USING btree ("recipient_id","read");--> statement-breakpoint
CREATE INDEX "report_messages_report_created_idx" ON "report_messages" USING btree ("report_id","created_at");--> statement-breakpoint
CREATE INDEX "reports_clip_reporter_idx" ON "reports" USING btree ("clip_id","reporter_id");--> statement-breakpoint
CREATE INDEX "reports_reporter_created_idx" ON "reports" USING btree ("reporter_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reports_status_created_idx" ON "reports" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reports_created_idx" ON "reports" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "users_roles_idx" ON "users" USING gin ("roles");--> statement-breakpoint
CREATE INDEX "zips_season_year_idx" ON "zips" USING btree ("season","year");