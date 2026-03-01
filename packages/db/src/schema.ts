import { pgTable, text, uuid, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  rewardType: text("reward_type").notNull().default("credit"), // credit, coupon, cash
  rewardValue: numeric("reward_value", { precision: 10, scale: 2 }).notNull().default("0"),
  rewardCurrency: text("reward_currency").notNull().default("USD"),
  cookieDays: integer("cookie_days").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrers = pgTable("referrers", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  externalUserId: text("external_user_id").notNull(), // from your SaaS
  email: text("email"),
  name: text("name"),
  referralCode: text("referral_code").notNull().unique(), // e.g. "john-abc123"
  totalReferrals: integer("total_referrals").notNull().default(0),
  pendingReward: numeric("pending_reward", { precision: 10, scale: 2 }).notNull().default("0"),
  paidReward: numeric("paid_reward", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  referrerId: uuid("referrer_id").notNull().references(() => referrers.id, { onDelete: "cascade" }),
  referredEmail: text("referred_email"),
  referredUserId: text("referred_user_id"),
  status: text("status").notNull().default("pending"), // pending, converted, rewarded
  convertedAt: timestamp("converted_at"),
  rewardedAt: timestamp("rewarded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("free"),
  status: text("status").notNull().default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const programsRelations = relations(programs, ({ one, many }) => ({
  user: one(users, { fields: [programs.userId], references: [users.id] }),
  referrers: many(referrers),
  referrals: many(referrals),
}));
export const referrersRelations = relations(referrers, ({ one, many }) => ({
  program: one(programs, { fields: [referrers.programId], references: [programs.id] }),
  referrals: many(referrals),
}));
export const referralsRelations = relations(referrals, ({ one }) => ({
  program: one(programs, { fields: [referrals.programId], references: [programs.id] }),
  referrer: one(referrers, { fields: [referrals.referrerId], references: [referrers.id] }),
}));

export type User = typeof users.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Referrer = typeof referrers.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
