import {
  pgTable,
  pgEnum,
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "pro"]);
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "active",
  "paused",
]);
export const rewardTypeEnum = pgEnum("reward_type", [
  "stripe_coupon",
  "credits",
  "custom_webhook",
]);
export const rewardStatusEnum = pgEnum("reward_status", [
  "pending",
  "processing",
  "sent",
  "failed",
]);
export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "done",
  "failed",
]);

// ── Tables ─────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: campaignStatusEnum("status").notNull().default("draft"),
  rewardType: rewardTypeEnum("reward_type").notNull(),
  rewardValue: text("reward_value").notNull(),
  triggerEvent: text("trigger_event"),
  campaignUrl: text("campaign_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrers = pgTable("referrers", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull(),
  refCode: text("ref_code").notNull().unique(),
  totalClicks: integer("total_clicks").notNull().default(0),
  totalSignups: integer("total_signups").notNull().default(0),
  totalConversions: integer("total_conversions").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversions = pgTable("conversions", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  referrerId: uuid("referrer_id")
    .notNull()
    .references(() => referrers.id, { onDelete: "cascade" }),
  convertedEmail: text("converted_email").notNull(),
  rewardStatus: rewardStatusEnum("reward_status").notNull().default("pending"),
  stripeCouponId: text("stripe_coupon_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rewardJobs = pgTable("reward_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversionId: uuid("conversion_id")
    .notNull()
    .unique()
    .references(() => conversions.id, { onDelete: "cascade" }),
  rewardType: rewardTypeEnum("reward_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: jobStatusEnum("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
});

// ── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  campaigns: many(campaigns),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, { fields: [campaigns.userId], references: [users.id] }),
  referrers: many(referrers),
  conversions: many(conversions),
}));

export const referrersRelations = relations(referrers, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [referrers.campaignId],
    references: [campaigns.id],
  }),
  conversions: many(conversions),
}));

export const conversionsRelations = relations(conversions, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [conversions.campaignId],
    references: [campaigns.id],
  }),
  referrer: one(referrers, {
    fields: [conversions.referrerId],
    references: [referrers.id],
  }),
  rewardJob: one(rewardJobs, {
    fields: [conversions.id],
    references: [rewardJobs.conversionId],
  }),
}));

export const rewardJobsRelations = relations(rewardJobs, ({ one }) => ({
  conversion: one(conversions, {
    fields: [rewardJobs.conversionId],
    references: [conversions.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// ── Type Exports ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Referrer = typeof referrers.$inferSelect;
export type NewReferrer = typeof referrers.$inferInsert;
export type Conversion = typeof conversions.$inferSelect;
export type NewConversion = typeof conversions.$inferInsert;
export type RewardJob = typeof rewardJobs.$inferSelect;
export type NewRewardJob = typeof rewardJobs.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
