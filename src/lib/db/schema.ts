/**
 * DATABASE SCHEMA (§27) — PostgreSQL via Drizzle ORM.
 * ---------------------------------------------------------------------------
 * Drizzle was chosen over Prisma for this deployment because the Prisma query
 * engine is fetched from binaries.prisma.sh at install time, which is not
 * reachable from every build environment. Drizzle is pure TypeScript with a
 * pure-JS driver (`postgres`), so the schema, the generated SQL and the runtime
 * all travel inside the repository.
 *
 * Conventions:
 *   - UUID primary keys (`gen_random_uuid()`, built into PostgreSQL 13+).
 *   - `createdAt` / `updatedAt` on every table.
 *   - Enums instead of arbitrary strings wherever a value set is closed.
 *   - Unique constraints on anything a human reads aloud: references, codes,
 *     batch numbers, emails.
 *   - Indexes on every column used for filtering or ordering in the UI.
 *   - Nullable capacity / temperature columns. §45 forbids inventing figures,
 *     so the schema must be able to represent "not supplied" as NULL rather
 *     than forcing a fabricated default.
 *
 * Credentials come from DATABASE_URL in the environment only. Nothing in this
 * file (or anywhere in `src/`) may contain a connection string.
 */

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ==========================================================================
   ENUMS
   ========================================================================== */

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "OPERATOR",
  "CLIENT",
]);

export const authProviderEnum = pgEnum("auth_provider", ["CREDENTIALS", "GOOGLE"]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
]);

export const inquirySourceEnum = pgEnum("inquiry_source", [
  "WEBSITE",
  "CALCULATOR",
  "PHONE",
  "EMAIL",
  "WHATSAPP",
  "MANUAL",
]);

export const inventoryStatusEnum = pgEnum("inventory_status", [
  "IN_TRANSIT",
  "RECEIVED",
  "IN_STORAGE",
  "RESERVED",
  "PICKING",
  "DISPATCHED",
  "ON_HOLD",
  "ADJUSTED",
]);

export const storageStatusEnum = pgEnum("storage_status", [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "MAINTENANCE",
  "QUARANTINE",
]);

export const zoneKindEnum = pgEnum("zone_kind", [
  "RECEIVING",
  "CHAMBER",
  "FROZEN",
  "PHARMA",
  "LOADING",
  "DISPATCH",
  "SECURITY",
]);

export const productCategoryEnum = pgEnum("product_category", [
  "PRODUCE",
  "MEAT_POULTRY",
  "SEAFOOD",
  "PHARMACEUTICAL",
  "GENERAL",
  "OTHER",
]);

export const unitOfMeasureEnum = pgEnum("unit_of_measure", [
  "PALLET",
  "TONNE",
  "KILOGRAM",
  "CARTON",
  "BOX",
  "UNIT",
]);

export const contractStatusEnum = pgEnum("contract_status", [
  "DRAFT",
  "ACTIVE",
  "SUSPENDED",
  "COMPLETED",
  "TERMINATED",
]);

export const leaseStatusEnum = pgEnum("lease_status", ["ACTIVE", "ENDED", "TRANSFERRED"]);

export const documentTypeEnum = pgEnum("document_type", [
  "CONTRACT",
  "INVOICE",
  "GATE_PASS",
  "CERTIFICATE",
  "PHOTOGRAPH",
  "REPORT",
  "OTHER",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "EMAIL",
  "WHATSAPP",
  "SMS",
  "IN_APP",
]);

/**
 * §31 — a notification is only ever marked SENT once the provider confirms it.
 * QUEUED means "we intend to send", SKIPPED means "no provider configured".
 */
export const notificationStatusEnum = pgEnum("notification_status", [
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
  "SKIPPED",
]);

export const eventSeverityEnum = pgEnum("event_severity", [
  "INFO",
  "NOTICE",
  "WARNING",
  "CRITICAL",
]);

/**
 * §40 — every telemetry row records where its value came from. A SIMULATION
 * row can never be mistaken for a SENSOR row, in the database or in the UI.
 */
export const telemetrySourceEnum = pgEnum("telemetry_source", [
  "SENSOR",
  "SIMULATION",
  "MANUAL",
]);

export const clientStatusEnum = pgEnum("client_status", [
  "PROSPECT",
  "ACTIVE",
  "DORMANT",
  "CLOSED",
]);

/* ==========================================================================
   SHARED COLUMN HELPERS
   ========================================================================== */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

/* ==========================================================================
   IDENTITY — users, OAuth accounts
   ========================================================================== */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    name: varchar("name", { length: 160 }),
    /** bcrypt hash. NULL for OAuth-only accounts. Never a plain-text password. */
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("CLIENT"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    /**
     * Incrementing this instantly invalidates every issued session token for
     * this user, giving admins a revocation switch without a sessions table.
     */
    tokenVersion: integer("token_version").notNull().default(0),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_role_idx").on(table.role),
    index("users_is_active_idx").on(table.isActive),
  ],
);

export const userAccounts = pgTable(
  "user_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: authProviderEnum("provider").notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("user_accounts_provider_unique").on(table.provider, table.providerAccountId),
    index("user_accounts_user_idx").on(table.userId),
  ],
);

/* ==========================================================================
   CLIENTS
   ========================================================================== */

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Portal login, present only once the client has been given credentials. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    companyName: varchar("company_name", { length: 200 }).notNull(),
    contactName: varchar("contact_name", { length: 160 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 40 }),
    whatsapp: varchar("whatsapp", { length: 40 }),
    address: text("address"),
    taxNumber: varchar("tax_number", { length: 60 }),
    status: clientStatusEnum("status").notNull().default("PROSPECT"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("clients_user_unique").on(table.userId),
    index("clients_company_idx").on(table.companyName),
    index("clients_status_idx").on(table.status),
    index("clients_email_idx").on(table.email),
  ],
);

/* ==========================================================================
   STORAGE INQUIRIES (§26) — public, no account required
   ========================================================================== */

export const storageInquiries = pgTable(
  "storage_inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Public reference shown to the submitter, e.g. TJ-7K3QM. */
    reference: varchar("reference", { length: 24 }).notNull(),
    source: inquirySourceEnum("source").notNull().default("WEBSITE"),
    status: inquiryStatusEnum("status").notNull().default("NEW"),

    /* Submitted details */
    name: varchar("name", { length: 160 }).notNull(),
    company: varchar("company", { length: 200 }),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    productCategory: productCategoryEnum("product_category"),
    productDescription: text("product_description"),
    quantity: numeric("quantity", { precision: 14, scale: 3 }),
    unit: unitOfMeasureEnum("unit"),
    storageDurationDays: integer("storage_duration_days"),
    message: text("message"),

    /* Calculator-only fields — NULL for a plain contact inquiry */
    requestedSetpointC: numeric("requested_setpoint_c", { precision: 5, scale: 2 }),
    needsTransport: boolean("needs_transport"),
    preferredStartAt: timestamp("preferred_start_at", { withTimezone: true }),

    /* Pipeline */
    assignedToId: uuid("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    internalNotes: text("internal_notes"),
    contactedAt: timestamp("contacted_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),

    /**
     * §38 — abuse metadata. Stores a salted hash of the submitter IP, never the
     * raw address, and never exposes it through any API response.
     */
    ipHash: varchar("ip_hash", { length: 64 }),

    ...timestamps,
  },
  (table) => [
    uniqueIndex("storage_inquiries_reference_unique").on(table.reference),
    index("storage_inquiries_status_idx").on(table.status),
    index("storage_inquiries_created_idx").on(
      sql`${table.createdAt} DESC`,
    ),
    index("storage_inquiries_email_idx").on(table.email),
    index("storage_inquiries_category_idx").on(table.productCategory),
    index("storage_inquiries_assigned_idx").on(table.assignedToId),
    index("storage_inquiries_client_idx").on(table.clientId),
  ],
);

/* ==========================================================================
   FACILITY — zones, telemetry, events
   ========================================================================== */

export const storageZones = pgTable(
  "storage_zones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Human-readable zone code, e.g. A-01, C-04. */
    code: varchar("code", { length: 24 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    kind: zoneKindEnum("kind").notNull(),
    purpose: text("purpose"),
    status: storageStatusEnum("status").notNull().default("AVAILABLE"),

    /**
     * NULL means "not supplied". The UI must then print the configured
     * fallback rather than a fabricated number (§45).
     */
    capacityPallets: integer("capacity_pallets"),
    occupiedPallets: integer("occupied_pallets").notNull().default(0),
    temperatureSetpointC: numeric("temperature_setpoint_c", { precision: 5, scale: 2 }),
    temperatureMinC: numeric("temperature_min_c", { precision: 5, scale: 2 }),
    temperatureMaxC: numeric("temperature_max_c", { precision: 5, scale: 2 }),
    humidityTargetPercent: integer("humidity_target_percent"),

    restrictedAccess: boolean("restricted_access").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("storage_zones_code_unique").on(table.code),
    index("storage_zones_kind_idx").on(table.kind),
    index("storage_zones_status_idx").on(table.status),
    index("storage_zones_active_idx").on(table.isActive),
  ],
);

/**
 * Append-only environmental log.
 *
 * Volume note: at one reading per zone per minute this table grows quickly.
 * In production, partition by month on `recordedAt` and apply a retention
 * policy; the query layer already filters by (zoneId, recordedAt) so a
 * partitioned layout needs no code change.
 */
export const telemetryLogs = pgTable(
  "telemetry_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zoneId: uuid("zone_id")
      .notNull()
      .references(() => storageZones.id, { onDelete: "cascade" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
    temperatureC: numeric("temperature_c", { precision: 5, scale: 2 }),
    humidityPercent: numeric("humidity_percent", { precision: 5, scale: 2 }),
    doorOpen: boolean("door_open"),
    compressorActive: boolean("compressor_active"),
    defrostActive: boolean("defrost_active"),
    alarmRaised: boolean("alarm_raised").notNull().default(false),
    /** §40 — provenance. SIMULATION rows are never presented as live data. */
    source: telemetrySourceEnum("source").notNull().default("SIMULATION"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("telemetry_zone_time_idx").on(table.zoneId, sql`${table.recordedAt} DESC`),
    index("telemetry_recorded_idx").on(sql`${table.recordedAt} DESC`),
    index("telemetry_alarm_idx").on(table.alarmRaised),
    index("telemetry_source_idx").on(table.source),
  ],
);

export const facilityEvents = pgTable(
  "facility_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zoneId: uuid("zone_id").references(() => storageZones.id, { onDelete: "set null" }),
    severity: eventSeverityEnum("severity").notNull().default("INFO"),
    /** Machine-readable event type, e.g. DOOR_OPENED, DEVIATION, ACCESS_GRANTED. */
    type: varchar("type", { length: 64 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    message: text("message"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    acknowledgedById: uuid("acknowledged_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("facility_events_occurred_idx").on(sql`${table.occurredAt} DESC`),
    index("facility_events_severity_idx").on(table.severity),
    index("facility_events_zone_idx").on(table.zoneId),
    index("facility_events_type_idx").on(table.type),
    index("facility_events_unacked_idx").on(table.acknowledgedAt),
  ],
);

/* ==========================================================================
   COMMERCIAL — contracts, leases, inventory
   ========================================================================== */

export const storageContracts = pgTable(
  "storage_contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    status: contractStatusEnum("status").notNull().default("DRAFT"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    palletPositions: integer("pallet_positions"),
    /**
     * NULL when the business has not supplied pricing (§25 forbids fabricating
     * a rate). The portal then shows "REQUEST A CUSTOM QUOTE".
     */
    ratePerPalletPerMonth: numeric("rate_per_pallet_per_month", {
      precision: 12,
      scale: 2,
    }),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    terms: text("terms"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("storage_contracts_reference_unique").on(table.reference),
    index("storage_contracts_client_idx").on(table.clientId),
    index("storage_contracts_status_idx").on(table.status),
    index("storage_contracts_start_idx").on(sql`${table.startAt} DESC`),
  ],
);

export const leases = pgTable(
  "leases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull(),
    contractId: uuid("contract_id").references(() => storageContracts.id, {
      onDelete: "cascade",
    }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    zoneId: uuid("zone_id").references(() => storageZones.id, { onDelete: "set null" }),
    status: leaseStatusEnum("status").notNull().default("ACTIVE"),
    palletPositions: integer("pallet_positions").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("leases_reference_unique").on(table.reference),
    index("leases_client_idx").on(table.clientId),
    index("leases_contract_idx").on(table.contractId),
    index("leases_zone_idx").on(table.zoneId),
    index("leases_status_idx").on(table.status),
  ],
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Batch reference printed on labels and gate passes, e.g. TJ-20481. */
    batchReference: varchar("batch_reference", { length: 32 }).notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    leaseId: uuid("lease_id").references(() => leases.id, { onDelete: "set null" }),
    zoneId: uuid("zone_id").references(() => storageZones.id, { onDelete: "set null" }),
    /** Rack/bay/level position inside the zone, e.g. C-04-R12-B03-L2. */
    locationCode: varchar("location_code", { length: 48 }),
    productCategory: productCategoryEnum("product_category").notNull(),
    productName: varchar("product_name", { length: 200 }).notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
    unit: unitOfMeasureEnum("unit").notNull().default("PALLET"),
    grossWeightKg: numeric("gross_weight_kg", { precision: 12, scale: 3 }),
    status: inventoryStatusEnum("status").notNull().default("IN_STORAGE"),
    /** Client-agreed set point for this batch. NULL when not supplied. */
    setpointC: numeric("setpoint_c", { precision: 5, scale: 2 }),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    expiryAt: timestamp("expiry_at", { withTimezone: true }),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("inventory_batch_unique").on(table.batchReference),
    index("inventory_client_idx").on(table.clientId),
    index("inventory_zone_idx").on(table.zoneId),
    index("inventory_status_idx").on(table.status),
    index("inventory_category_idx").on(table.productCategory),
    index("inventory_received_idx").on(sql`${table.receivedAt} DESC`),
    index("inventory_lease_idx").on(table.leaseId),
  ],
);

/* ==========================================================================
   DOCUMENTS, NOTIFICATIONS, AUDIT
   ========================================================================== */

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: documentTypeEnum("type").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    /**
     * Object-storage key. The file bytes live outside the repository and
     * outside the database; only the pointer is stored here.
     */
    storageKey: varchar("storage_key", { length: 512 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }),
    sizeBytes: integer("size_bytes"),
    /** Scoping — at least one of these is normally set. */
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    inquiryId: uuid("inquiry_id").references(() => storageInquiries.id, {
      onDelete: "cascade",
    }),
    contractId: uuid("contract_id").references(() => storageContracts.id, {
      onDelete: "cascade",
    }),
    inventoryItemId: uuid("inventory_item_id").references(() => inventoryItems.id, {
      onDelete: "cascade",
    }),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Visible to the owning client in the portal, or admin-only. */
    clientVisible: boolean("client_visible").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("documents_client_idx").on(table.clientId),
    index("documents_type_idx").on(table.type),
    index("documents_inquiry_idx").on(table.inquiryId),
    index("documents_contract_idx").on(table.contractId),
    index("documents_inventory_idx").on(table.inventoryItemId),
    index("documents_created_idx").on(sql`${table.createdAt} DESC`),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationStatusEnum("status").notNull().default("QUEUED"),
    recipient: varchar("recipient", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 240 }),
    body: text("body"),
    inquiryId: uuid("inquiry_id").references(() => storageInquiries.id, {
      onDelete: "cascade",
    }),
    /** Provider's own message id — the only proof that delivery happened. */
    providerMessageId: varchar("provider_message_id", { length: 255 }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_status_idx").on(table.status),
    index("notifications_channel_idx").on(table.channel),
    index("notifications_inquiry_idx").on(table.inquiryId),
    index("notifications_created_idx").on(sql`${table.createdAt} DESC`),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Verb, e.g. INQUIRY_STATUS_CHANGED, USER_ROLE_UPDATED, ZONE_UPDATED. */
    action: varchar("action", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 60 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }),
    before: jsonb("before"),
    after: jsonb("after"),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: varchar("user_agent", { length: 320 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_actor_idx").on(table.actorUserId),
    index("audit_entity_idx").on(table.entityType, table.entityId),
    index("audit_action_idx").on(table.action),
    index("audit_created_idx").on(sql`${table.createdAt} DESC`),
  ],
);

/* ==========================================================================
   RELATIONS
   ========================================================================== */

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(userAccounts),
  clientProfile: one(clients, { fields: [users.id], references: [clients.userId] }),
  assignedInquiries: many(storageInquiries),
  auditLogs: many(auditLogs),
}));

export const userAccountsRelations = relations(userAccounts, ({ one }) => ({
  user: one(users, { fields: [userAccounts.userId], references: [users.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  inquiries: many(storageInquiries),
  contracts: many(storageContracts),
  leases: many(leases),
  inventoryItems: many(inventoryItems),
  documents: many(documents),
}));

export const storageInquiriesRelations = relations(storageInquiries, ({ one, many }) => ({
  assignee: one(users, { fields: [storageInquiries.assignedToId], references: [users.id] }),
  client: one(clients, { fields: [storageInquiries.clientId], references: [clients.id] }),
  documents: many(documents),
  notifications: many(notifications),
}));

export const storageZonesRelations = relations(storageZones, ({ many }) => ({
  telemetryLogs: many(telemetryLogs),
  facilityEvents: many(facilityEvents),
  inventoryItems: many(inventoryItems),
  leases: many(leases),
}));

export const telemetryLogsRelations = relations(telemetryLogs, ({ one }) => ({
  zone: one(storageZones, { fields: [telemetryLogs.zoneId], references: [storageZones.id] }),
}));

export const facilityEventsRelations = relations(facilityEvents, ({ one }) => ({
  zone: one(storageZones, { fields: [facilityEvents.zoneId], references: [storageZones.id] }),
  acknowledgedBy: one(users, {
    fields: [facilityEvents.acknowledgedById],
    references: [users.id],
  }),
}));

export const storageContractsRelations = relations(storageContracts, ({ one, many }) => ({
  client: one(clients, { fields: [storageContracts.clientId], references: [clients.id] }),
  leases: many(leases),
  documents: many(documents),
}));

export const leasesRelations = relations(leases, ({ one, many }) => ({
  contract: one(storageContracts, { fields: [leases.contractId], references: [storageContracts.id] }),
  client: one(clients, { fields: [leases.clientId], references: [clients.id] }),
  zone: one(storageZones, { fields: [leases.zoneId], references: [storageZones.id] }),
  inventoryItems: many(inventoryItems),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  client: one(clients, { fields: [inventoryItems.clientId], references: [clients.id] }),
  lease: one(leases, { fields: [inventoryItems.leaseId], references: [leases.id] }),
  zone: one(storageZones, { fields: [inventoryItems.zoneId], references: [storageZones.id] }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  client: one(clients, { fields: [documents.clientId], references: [clients.id] }),
  inquiry: one(storageInquiries, {
    fields: [documents.inquiryId],
    references: [storageInquiries.id],
  }),
  contract: one(storageContracts, {
    fields: [documents.contractId],
    references: [storageContracts.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [documents.inventoryItemId],
    references: [inventoryItems.id],
  }),
  uploadedBy: one(users, { fields: [documents.uploadedById], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  inquiry: one(storageInquiries, {
    fields: [notifications.inquiryId],
    references: [storageInquiries.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorUserId], references: [users.id] }),
}));

/* ==========================================================================
   INFERRED TYPES — the typed API contract used across server actions & routes
   ========================================================================== */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserAccount = typeof userAccounts.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type StorageInquiry = typeof storageInquiries.$inferSelect;
export type NewStorageInquiry = typeof storageInquiries.$inferInsert;
export type StorageZone = typeof storageZones.$inferSelect;
export type NewStorageZone = typeof storageZones.$inferInsert;
export type TelemetryLog = typeof telemetryLogs.$inferSelect;
export type FacilityEvent = typeof facilityEvents.$inferSelect;
export type StorageContract = typeof storageContracts.$inferSelect;
export type Lease = typeof leases.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type InquiryStatus = (typeof inquiryStatusEnum.enumValues)[number];
export type InquirySource = (typeof inquirySourceEnum.enumValues)[number];
export type InventoryStatus = (typeof inventoryStatusEnum.enumValues)[number];
export type StorageStatus = (typeof storageStatusEnum.enumValues)[number];
export type ZoneKind = (typeof zoneKindEnum.enumValues)[number];
export type ProductCategory = (typeof productCategoryEnum.enumValues)[number];
export type UnitOfMeasure = (typeof unitOfMeasureEnum.enumValues)[number];
export type ContractStatus = (typeof contractStatusEnum.enumValues)[number];
export type LeaseStatus = (typeof leaseStatusEnum.enumValues)[number];
export type DocumentType = (typeof documentTypeEnum.enumValues)[number];
export type NotificationChannel = (typeof notificationChannelEnum.enumValues)[number];
export type NotificationStatus = (typeof notificationStatusEnum.enumValues)[number];
export type EventSeverity = (typeof eventSeverityEnum.enumValues)[number];
export type TelemetrySource = (typeof telemetrySourceEnum.enumValues)[number];
export type ClientStatus = (typeof clientStatusEnum.enumValues)[number];
