import { boolean, customType, index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({ dataType: () => 'bytea' });

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const userRole = pgEnum('user_role', ['user', 'admin']);

/** Someone who signed in with a phone number (SMS code) or a Google account. */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: text('phone').unique(),
  email: text('email').unique(),
  googleSub: text('google_sub').unique(),
  name: text('name'),
  role: userRole('role').notNull().default('user'),
  createdAt: createdAt(),
});

/** Signed-in sessions; only a SHA-256 of the token is stored, so a database leak cannot sign anyone in. */
export const sessions = pgTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)]
);

/** The pending SMS code per phone number (hashed), with a wrong-guess counter. */
export const otpCodes = pgTable('otp_codes', {
  phone: text('phone').primaryKey(),
  codeHash: text('code_hash').notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});

/** Monthly store plans: live AI seconds included and the price in so'm. */
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  monthlySeconds: integer('monthly_seconds').notNull(),
  priceUzs: integer('price_uzs').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
});

export const storeStatus = pgEnum('store_status', ['active', 'paused']);

/** A shop using A12 on its site; live AI seconds are counted against its plan each period. */
export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  planId: uuid('plan_id').references(() => plans.id, { onDelete: 'set null' }),
  status: storeStatus('status').notNull().default('active'),
  /** Public key the shop's widget sends; identifies the store, grants nothing else. */
  widgetKey: text('widget_key').notNull().unique(),
  usedSeconds: integer('used_seconds').notNull().default(0),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull().defaultNow(),
  /** Bought top-up seconds; spent after the monthly plan runs out and never reset. */
  extraSeconds: integer('extra_seconds').notNull().default(0),
  createdAt: createdAt(),
});

/** One-off top-ups of live AI seconds a shop can buy on top of its plan. */
export const packs = pgTable('packs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  seconds: integer('seconds').notNull(),
  priceUzs: integer('price_uzs').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
});

export const paymentKind = pgEnum('payment_kind', ['plan', 'pack']);
export const paymentStatus = pgEnum('payment_status', ['pending', 'approved', 'rejected']);

/**
 * A shop's card transfer for a plan or a pack, with the receipt it uploaded. An admin checks
 * the transfer and approves it, which grants the seconds.
 */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    kind: paymentKind('kind').notNull(),
    planId: uuid('plan_id').references(() => plans.id, { onDelete: 'set null' }),
    packId: uuid('pack_id').references(() => packs.id, { onDelete: 'set null' }),
    /** What was bought, copied at the time so later price edits do not rewrite history. */
    title: text('title').notNull(),
    seconds: integer('seconds').notNull(),
    amountUzs: integer('amount_uzs').notNull(),
    receipt: bytea('receipt').notNull(),
    receiptType: text('receipt_type').notNull(),
    status: paymentStatus('status').notNull().default('pending'),
    adminNote: text('admin_note'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index('payments_status_idx').on(t.status, t.createdAt), index('payments_store_idx').on(t.storeId)]
);

/** Admin-editable values: the card shops pay to, and the dollar rate for cost reports. */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const garmentKind = pgEnum('garment_kind', ['upper_body', 'lower_body', 'dresses']);

/** A store's catalogue item shown in its try-on. */
export const garments = pgTable(
  'garments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    imageUrl: text('image_url').notNull(),
    kind: garmentKind('kind').notNull().default('upper_body'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index('garments_store_idx').on(t.storeId)]
);

export const videoJobStatus = pgEnum('video_job_status', ['pending', 'completed', 'failed']);

/** A shop's video ad variant rendered by Decart in the background; planSeconds were reserved for it. */
export const videoJobs = pgTable(
  'video_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    decartJobId: text('decart_job_id').notNull(),
    prompt: text('prompt').notNull(),
    videoSeconds: integer('video_seconds').notNull(),
    planSeconds: integer('plan_seconds').notNull(),
    status: videoJobStatus('status').notNull().default('pending'),
    createdAt: createdAt(),
  },
  (t) => [index('video_jobs_store_idx').on(t.storeId, t.createdAt)]
);

/** One live AI session granted, with the seconds reserved for it (the session cap). */
export const liveSessions = pgTable(
  'live_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id').references(() => stores.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    source: text('source').notNull(),
    seconds: integer('seconds').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('live_sessions_store_idx').on(t.storeId, t.createdAt)]
);
