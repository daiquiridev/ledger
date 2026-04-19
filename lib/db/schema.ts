import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  timestamp,
  boolean,
  jsonb,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", ["credit_card", "bank_account"]);
export const uploadStatusEnum = pgEnum("upload_status", ["pending", "parsing", "ready", "imported", "failed"]);
export const parseMethodEnum = pgEnum("parse_method", ["structural", "ai"]);
export const txStatusEnum = pgEnum("tx_status", ["pending", "approved", "skipped"]);

// ── Accounts ──────────────────────────────────────────────
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  bank: text("bank").notNull(),        // "garanti" | "yapi_kredi" | "isbankasi" | ...
  type: accountTypeEnum("type").notNull(),
  last4: text("last4"),
  currency: text("currency").notNull().default("TRY"),
  color: text("color").default("var(--c1)"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Categories ────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  labelTr: text("label_tr").notNull(),
  labelEn: text("label_en").notNull(),
  parentId: uuid("parent_id"),         // null = top-level group
  color: text("color").default("var(--c1)"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
});

// ── Tags ──────────────────────────────────────────────────
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color"),
});

// ── Uploads ───────────────────────────────────────────────
export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  filetype: text("filetype").notNull(),   // "xls" | "pdf" | "csv"
  sizeBytes: integer("size_bytes"),
  status: uploadStatusEnum("status").notNull().default("pending"),
  parseMethod: parseMethodEnum("parse_method"),
  txCount: integer("tx_count"),
  dateRangeFrom: date("date_range_from"),
  dateRangeTo: date("date_range_to"),
  errorMessage: text("error_message"),
  accountId: uuid("account_id").references(() => accounts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// ── Transactions ──────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  uploadId: uuid("upload_id").references(() => uploads.id),
  date: date("date").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(), // negative = spend
  currency: text("currency").notNull().default("TRY"),
  categoryId: uuid("category_id").references(() => categories.id),
  note: text("note"),
  suspicious: boolean("suspicious").default(false),
  // import review fields
  reviewStatus: txStatusEnum("review_status").default("pending"),
  confidence: integer("confidence"),   // 0-100 AI confidence on category
  // raw source line from file
  rawSource: text("raw_source"),
  // flexible custom fields
  metadata: jsonb("metadata").default({}),
  // dedup key
  dedupHash: text("dedup_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Transaction ↔ Tag (many-to-many) ─────────────────────
export const transactionTags = pgTable("transaction_tags", {
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "cascade" }).notNull(),
  tagId: uuid("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
});

// ── Wealth entries (assets & liabilities) ─────────────────
export const wealthEntries = pgTable("wealth_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(), // "cash"|"fx"|"gold"|"stock"|"fund"|"card-debt"|"loan"
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 20, scale: 6 }),
  avgCost: numeric("avg_cost", { precision: 20, scale: 6 }),
  metadata: jsonb("metadata").default({}), // rate, term, remaining, etc.
  color: text("color"),
  note: text("note"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── FX rates cache ────────────────────────────────────────
export const fxRates = pgTable("fx_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  currency: text("currency").notNull(),
  yearMonth: text("year_month").notNull(), // "2026-04"
  rateTry: numeric("rate_try", { precision: 12, scale: 4 }).notNull(),
});

// ── User preferences ──────────────────────────────────────
export const preferences = pgTable("preferences", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
