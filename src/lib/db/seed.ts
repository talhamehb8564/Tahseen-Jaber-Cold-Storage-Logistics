/**
 * DATABASE SEED — development fixtures
 * ---------------------------------------------------------------------------
 * Run with: npm run db:seed
 *
 * WHAT THIS CREATES
 *   Three users (ADMIN, OPERATOR, CLIENT), two client companies, the eight zones
 *   from `lib/catalog`, inventory batches, a contract and lease per client,
 *   facility events, documents, notifications, audit entries, sample inquiries in
 *   every status, and a short telemetry history.
 *
 * TWO HONESTY RULES BAKED IN (§40, §45)
 *   1. Every telemetry row is written with `source = "SIMULATION"`. The schema
 *      carries that column precisely so synthetic readings can never be mistaken
 *      for sensor data later, even inside a real database.
 *   2. `capacityPallets` is left NULL. Warehouse capacity has not been confirmed
 *      by the business, and a seed script is not a place to invent a
 *      specification. Zone OCCUPANCY, by contrast, is computed by summing the
 *      pallets actually seeded into that zone — so it is an internally consistent
 *      fact about the fixture rather than a made-up number.
 *
 * CREDENTIALS
 *   Read from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (and the operator/client
 *   equivalents) with development defaults. Passwords are bcrypt-hashed before
 *   they are written — never stored in plain text (§30). Change them for anything
 *   beyond local development.
 */

import { sql } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import {
  auditLogs,
  clients,
  documents,
  facilityEvents,
  inventoryItems,
  leases,
  notifications,
  storageContracts,
  storageInquiries,
  storageZones,
  telemetryLogs,
  users,
} from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { generateBatchReference, generateReference } from "@/lib/utilities/reference";
import { facilityZones } from "@/lib/catalog";

/* ==========================================================================
   FIXTURE DEFINITIONS
   ========================================================================== */

/** catalog `kind` (lowercase) → database zone_kind enum. */
const ZONE_KIND = {
  receiving: "RECEIVING",
  chamber: "CHAMBER",
  frozen: "FROZEN",
  pharma: "PHARMA",
  loading: "LOADING",
  dispatch: "DISPATCH",
  security: "SECURITY",
} as const;

/**
 * Set points and humidity targets for the fixture. These describe the DEMO
 * configuration of a development database — not published facility
 * specifications, which is why the public site prints "CLIENT CONFIGURED"
 * regardless of what is in here.
 */
const ZONE_SETPOINTS: Record<string, { setpointC: number | null; humidity: number | null }> = {
  "R-01": { setpointC: null, humidity: null },
  "A-01": { setpointC: 2.0, humidity: 88 },
  "B-01": { setpointC: 0.5, humidity: 84 },
  "C-04": { setpointC: -18.4, humidity: 72 },
  "P-02": { setpointC: 4.5, humidity: 46 },
  "L-01": { setpointC: null, humidity: null },
  "D-01": { setpointC: null, humidity: null },
  "S-01": { setpointC: null, humidity: null },
};

const CREDENTIALS = {
  admin: {
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@tahseenjaber.test",
    password: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-Admin-2026",
    name: "Facility Administrator",
  },
  operator: {
    email: process.env.SEED_OPERATOR_EMAIL ?? "operator@tahseenjaber.test",
    password: process.env.SEED_OPERATOR_PASSWORD ?? "ChangeMe-Operator-2026",
    name: "Operations Controller",
  },
  client: {
    email: process.env.SEED_CLIENT_EMAIL ?? "client@tahseenjaber.test",
    password: process.env.SEED_CLIENT_PASSWORD ?? "ChangeMe-Client-2026",
    name: "Portal User",
  },
};

/* ==========================================================================
   ENTRY POINT
   ========================================================================== */

async function main(): Promise<void> {
  if (!isDatabaseConfigured()) {
    console.error(
      [
        "",
        "✖ DATABASE_URL is not set — nothing to seed.",
        "",
        "  Copy .env.example to .env.local and set DATABASE_URL to a PostgreSQL",
        "  connection string, then run:",
        "",
        "    npm run db:push     # create the schema",
        "    npm run db:seed     # load these fixtures",
        "",
        "  The site runs without a database: it falls back to the SIMULATION",
        "  data provider, which is the intended behaviour (§40).",
        "",
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  const db = getDb();
  if (!db) {
    console.error("✖ Could not open a database connection.");
    process.exitCode = 1;
    return;
  }

  console.log("Seeding development fixtures…\n");

  /* ------------------------------------------------------------- users --- */
  const [adminHash, operatorHash, clientHash] = await Promise.all([
    hashPassword(CREDENTIALS.admin.password),
    hashPassword(CREDENTIALS.operator.password),
    hashPassword(CREDENTIALS.client.password),
  ]);

  const [admin] = await db
    .insert(users)
    .values([
      {
        email: CREDENTIALS.admin.email,
        name: CREDENTIALS.admin.name,
        passwordHash: adminHash,
        role: "ADMIN",
        isActive: true,
        emailVerifiedAt: new Date(),
      },
      {
        email: CREDENTIALS.operator.email,
        name: CREDENTIALS.operator.name,
        passwordHash: operatorHash,
        role: "OPERATOR",
        isActive: true,
        emailVerifiedAt: new Date(),
      },
      {
        email: CREDENTIALS.client.email,
        name: CREDENTIALS.client.name,
        passwordHash: clientHash,
        role: "CLIENT",
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    ])
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash: sql`excluded.password_hash`, name: sql`excluded.name` },
    })
    .returning({ id: users.id, email: users.email, role: users.role });

  if (!admin) throw new Error("Failed to create users");

  const adminUser = admin;
  const operatorUser = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.email} = ${CREDENTIALS.operator.email}`)
    .limit(1);
  const clientUser = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.email} = ${CREDENTIALS.client.email}`)
    .limit(1);

  console.log(`  ✓ users          3 (ADMIN, OPERATOR, CLIENT)`);

  /* ----------------------------------------------------------- clients --- */
  const [clientA, clientB] = await db
    .insert(clients)
    .values([
      {
        userId: clientUser[0]?.id ?? null,
        companyName: "Al-Rafidain Fresh Produce",
        contactName: CREDENTIALS.client.name,
        email: CREDENTIALS.client.email,
        phone: null,
        address: null,
        status: "ACTIVE",
        notes: "Seeded fixture — portal demonstration account.",
      },
      {
        userId: null,
        companyName: "Tigris Seafood Trading",
        contactName: null,
        email: null,
        phone: null,
        address: null,
        status: "PROSPECT",
        notes: "Seeded fixture — no portal credentials issued.",
      },
    ])
    .onConflictDoUpdate({
      target: clients.userId,
      set: { companyName: sql`excluded.company_name` },
    })
    .returning({ id: clients.id, companyName: clients.companyName });

  const firstClientId = clientA?.id ?? null;
  const secondClientId = clientB?.id ?? firstClientId;
  console.log(`  ✓ clients        2`);

  /* ------------------------------------------------------------- zones --- */
  const zoneRows = facilityZones.map((zone, index) => ({
    code: zone.code,
    name: zone.name,
    kind: ZONE_KIND[zone.kind as keyof typeof ZONE_KIND],
    purpose: zone.purpose,
    status: "AVAILABLE" as const,
    // §45 — capacity is NOT supplied, so it is not invented here either.
    capacityPallets: null,
    occupiedPallets: 0,
    temperatureSetpointC:
      ZONE_SETPOINTS[zone.code]?.setpointC != null
        ? String(ZONE_SETPOINTS[zone.code]!.setpointC)
        : null,
    humidityTargetPercent: ZONE_SETPOINTS[zone.code]?.humidity ?? null,
    restrictedAccess: zone.kind === "pharma" || zone.kind === "security",
    isActive: true,
    sortOrder: index,
  }));

  const zones = await db
    .insert(storageZones)
    .values(zoneRows)
    .onConflictDoUpdate({
      target: storageZones.code,
      set: {
        name: sql`excluded.name`,
        kind: sql`excluded.kind`,
        purpose: sql`excluded.purpose`,
        restrictedAccess: sql`excluded.restricted_access`,
        sortOrder: sql`excluded.sort_order`,
      },
    })
    .returning({ id: storageZones.id, code: storageZones.code });

  const zoneByCode = new Map(zones.map((zone) => [zone.code, zone.id]));
  console.log(`  ✓ zones          ${zones.length}`);

  /* --------------------------------------------------------- contracts --- */
  const now = new Date();
  const yearAhead = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const [contract] = await db
    .insert(storageContracts)
    .values({
      reference: generateReference(),
      clientId: firstClientId!,
      status: "ACTIVE",
      startAt: now,
      endAt: yearAhead,
      palletPositions: 40,
      // §25 — no pricing rules supplied, so no rate is fabricated.
      ratePerPalletPerMonth: null,
      currency: "USD",
      terms:
        "Seeded fixture. Rate is null because published pricing has not been supplied; the portal shows REQUEST A CUSTOM QUOTE.",
    })
    .returning({ id: storageContracts.id });

  const [lease] = await db
    .insert(leases)
    .values({
      reference: generateReference(),
      contractId: contract?.id ?? null,
      clientId: firstClientId!,
      zoneId: zoneByCode.get("A-01") ?? null,
      status: "ACTIVE",
      palletPositions: 40,
      startedAt: now,
      notes: "Seeded fixture lease against Cold Room A.",
    })
    .returning({ id: leases.id });

  console.log(`  ✓ contracts      1 (rate NULL per §25)`);
  console.log(`  ✓ leases         1`);

  /* --------------------------------------------------------- inventory --- */
  interface BatchSeed {
    zoneCode: string;
    category: "PRODUCE" | "MEAT_POULTRY" | "SEAFOOD" | "PHARMACEUTICAL";
    product: string;
    quantity: number;
    unit: "PALLET" | "TONNE" | "CARTON";
    status: "IN_STORAGE" | "RECEIVED" | "RESERVED" | "PICKING" | "DISPATCHED" | "ON_HOLD";
    setpointC: number | null;
    clientId: string | null;
    leaseId: string | null;
    daysAgo: number;
  }

  const batches: BatchSeed[] = [
    { zoneCode: "A-01", category: "PRODUCE", product: "Tomatoes, graded", quantity: 18, unit: "PALLET", status: "IN_STORAGE", setpointC: 2.0, clientId: firstClientId, leaseId: lease?.id ?? null, daysAgo: 4 },
    { zoneCode: "A-01", category: "PRODUCE", product: "Cucumbers", quantity: 12, unit: "PALLET", status: "IN_STORAGE", setpointC: 2.0, clientId: firstClientId, leaseId: lease?.id ?? null, daysAgo: 6 },
    { zoneCode: "A-01", category: "PRODUCE", product: "Leaf greens, boxed", quantity: 8, unit: "CARTON", status: "RESERVED", setpointC: 2.0, clientId: firstClientId, leaseId: lease?.id ?? null, daysAgo: 2 },
    { zoneCode: "B-01", category: "MEAT_POULTRY", product: "Chicken, whole frozen", quantity: 22, unit: "PALLET", status: "IN_STORAGE", setpointC: 0.5, clientId: secondClientId, leaseId: null, daysAgo: 9 },
    { zoneCode: "B-01", category: "MEAT_POULTRY", product: "Lamb cuts, vacuum packed", quantity: 9, unit: "PALLET", status: "PICKING", setpointC: 0.5, clientId: secondClientId, leaseId: null, daysAgo: 12 },
    { zoneCode: "C-04", category: "SEAFOOD", product: "Shrimp, block frozen", quantity: 26, unit: "PALLET", status: "IN_STORAGE", setpointC: -18.4, clientId: secondClientId, leaseId: null, daysAgo: 15 },
    { zoneCode: "C-04", category: "SEAFOOD", product: "Whole fish, glazed", quantity: 14, unit: "PALLET", status: "IN_STORAGE", setpointC: -18.4, clientId: firstClientId, leaseId: null, daysAgo: 7 },
    { zoneCode: "C-04", category: "SEAFOOD", product: "Fillets, retail packed", quantity: 6, unit: "CARTON", status: "ON_HOLD", setpointC: -18.4, clientId: firstClientId, leaseId: null, daysAgo: 3 },
    { zoneCode: "P-02", category: "PHARMACEUTICAL", product: "Vaccines, sealed cartons", quantity: 5, unit: "PALLET", status: "IN_STORAGE", setpointC: 4.5, clientId: firstClientId, leaseId: null, daysAgo: 5 },
    { zoneCode: "P-02", category: "PHARMACEUTICAL", product: "Reagents, temperature sensitive", quantity: 3, unit: "CARTON", status: "RECEIVED", setpointC: 4.5, clientId: firstClientId, leaseId: null, daysAgo: 1 },
    { zoneCode: "D-01", category: "PRODUCE", product: "Mixed produce, outbound", quantity: 7, unit: "PALLET", status: "DISPATCHED", setpointC: null, clientId: firstClientId, leaseId: null, daysAgo: 2 },
  ];

  const seededBatches: { zoneId: string; pallets: number }[] = [];

  for (const batch of batches) {
    const zoneId = zoneByCode.get(batch.zoneCode) ?? null;
    const receivedAt = new Date(now.getTime() - batch.daysAgo * 24 * 60 * 60 * 1000);

    await db.insert(inventoryItems).values({
      batchReference: generateBatchReference(),
      clientId: batch.clientId ?? firstClientId!,
      leaseId: batch.leaseId,
      zoneId,
      locationCode: `${batch.zoneCode}-R${String(1 + (batch.daysAgo % 8)).padStart(2, "0")}-B${String(1 + (batch.quantity % 5)).padStart(2, "0")}-L1`,
      productCategory: batch.category,
      productName: batch.product,
      quantity: String(batch.quantity),
      unit: batch.unit,
      grossWeightKg: batch.unit === "PALLET" ? String(batch.quantity * 640) : null,
      status: batch.status,
      setpointC: batch.setpointC != null ? String(batch.setpointC) : null,
      receivedAt,
      dispatchedAt: batch.status === "DISPATCHED" ? new Date(receivedAt.getTime() + 2 * 86_400_000) : null,
      notes: "Seeded development fixture.",
    });

    if (zoneId && batch.unit === "PALLET" && batch.status !== "DISPATCHED") {
      seededBatches.push({ zoneId, pallets: batch.quantity });
    }
  }

  console.log(`  ✓ inventory      ${batches.length} batches`);

  /* --- Occupancy DERIVED from the stock actually seeded, not invented. --- */
  const occupancy = new Map<string, number>();
  for (const entry of seededBatches) {
    occupancy.set(entry.zoneId, (occupancy.get(entry.zoneId) ?? 0) + entry.pallets);
  }
  for (const [zoneId, pallets] of occupancy) {
    await db
      .update(storageZones)
      .set({ occupiedPallets: pallets, status: pallets > 0 ? "OCCUPIED" : "AVAILABLE" })
      .where(sql`${storageZones.id} = ${zoneId}`);
  }
  console.log(`  ✓ occupancy      derived from seeded stock (${occupancy.size} zones)`);

  /* --------------------------------------------------------- telemetry --- */
  // 48 hours of hourly readings per temperature-controlled zone, all marked
  // SIMULATION so they can never be mistaken for sensor data (§40).
  const telemetryRows: (typeof telemetryLogs.$inferInsert)[] = [];
  const HOURS = 48;

  for (const zone of zones) {
    const setpoint = ZONE_SETPOINTS[zone.code]?.setpointC ?? null;
    const humidity = ZONE_SETPOINTS[zone.code]?.humidity ?? null;
    if (setpoint === null) continue;

    for (let hour = HOURS; hour >= 0; hour -= 1) {
      const recordedAt = new Date(now.getTime() - hour * 60 * 60 * 1000);
      // Deterministic pseudo-jitter: no RNG dependency, reproducible output.
      const wave = Math.sin((hour / 6) * Math.PI) * 0.45;
      const drift = ((hour * 37) % 11) / 10 - 0.5;
      const temperatureC = Number((setpoint + wave + drift * 0.3).toFixed(2));
      const humidityPercent = humidity != null ? Number((humidity + drift * 2).toFixed(2)) : null;

      // One deviation window so the alarm path has something to show.
      const isDeviation = zone.code === "C-04" && hour >= 18 && hour <= 21;

      telemetryRows.push({
        zoneId: zone.id,
        recordedAt,
        temperatureC: String(isDeviation ? temperatureC + 2.6 : temperatureC),
        humidityPercent: humidityPercent != null ? String(humidityPercent) : null,
        doorOpen: hour % 9 === 0 ? true : null,
        compressorActive: hour % 3 !== 0,
        defrostActive: hour % 12 === 0,
        alarmRaised: isDeviation,
        source: "SIMULATION",
      });
    }
  }

  if (telemetryRows.length > 0) {
    // Chunked so a large seed does not exceed the driver's parameter limit.
    for (let index = 0; index < telemetryRows.length; index += 500) {
      await db.insert(telemetryLogs).values(telemetryRows.slice(index, index + 500));
    }
  }
  console.log(`  ✓ telemetry      ${telemetryRows.length} readings (source=SIMULATION)`);

  /* ------------------------------------------------------ facility events --- */
  const deviationZoneId = zoneByCode.get("C-04") ?? null;

  await db.insert(facilityEvents).values([
    {
      zoneId: deviationZoneId,
      severity: "WARNING",
      type: "DEVIATION",
      title: "Temperature deviation in Frozen Storage",
      message:
        "Seeded fixture event. Zone C-04 rose above its configured band during a defrost window and recovered.",
      occurredAt: new Date(now.getTime() - 19 * 60 * 60 * 1000),
      acknowledgedAt: new Date(now.getTime() - 18.5 * 60 * 60 * 1000),
      acknowledgedById: operatorUser[0]?.id ?? null,
    },
    {
      zoneId: zoneByCode.get("R-01") ?? null,
      severity: "INFO",
      type: "INTAKE",
      title: "Consignment received at dock",
      message: "Seeded fixture event. Batch checked against documentation and placed.",
      occurredAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
    },
    {
      zoneId: zoneByCode.get("P-02") ?? null,
      severity: "INFO",
      type: "ACCESS_GRANTED",
      title: "Restricted zone accessed",
      message: "Seeded fixture event. Credential presented at the pharma door.",
      occurredAt: new Date(now.getTime() - 30 * 60 * 60 * 1000),
    },
    {
      zoneId: zoneByCode.get("D-01") ?? null,
      severity: "INFO",
      type: "DISPATCH",
      title: "Load released through the gate",
      message: "Seeded fixture event. Gate pass matched the outbound order.",
      occurredAt: new Date(now.getTime() - 50 * 60 * 60 * 1000),
    },
    {
      zoneId: zoneByCode.get("A-01") ?? null,
      severity: "CRITICAL",
      type: "DOOR_HELD_OPEN",
      title: "Chamber door held open",
      message:
        "Seeded fixture event, unacknowledged — present so the alert queue is not empty.",
      occurredAt: new Date(now.getTime() - 40 * 60 * 1000),
    },
  ]);
  console.log(`  ✓ events         5 (1 unacknowledged)`);

  /* ---------------------------------------------------------- inquiries --- */
  const inquiryStates = [
    { status: "NEW", name: "Kareem Abbas", company: "Baghdad Greens", category: "PRODUCE" as const, daysAgo: 0.2 },
    { status: "CONTACTED", name: "Layla Hassan", company: "Tigris Seafood Trading", category: "SEAFOOD" as const, daysAgo: 1 },
    { status: "QUOTED", name: "Omar Farouk", company: "Al-Rafidain Fresh Produce", category: "PRODUCE" as const, daysAgo: 3 },
    { status: "APPROVED", name: "Sara Nouri", company: "Medipharm Distribution", category: "PHARMACEUTICAL" as const, daysAgo: 6 },
    { status: "REJECTED", name: "Hussein Ali", company: null, category: "MEAT_POULTRY" as const, daysAgo: 9 },
    { status: "COMPLETED", name: "Dunya Karim", company: "Baghdad Greens", category: "PRODUCE" as const, daysAgo: 14 },
  ] as const;

  for (const state of inquiryStates) {
    await db.insert(storageInquiries).values({
      reference: generateReference(),
      source: "WEBSITE",
      status: state.status,
      name: state.name,
      company: state.company,
      email: `${state.name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.test`,
      phone: null,
      productCategory: state.category,
      productDescription: "Seeded development fixture.",
      quantity: String(20 + Math.round(state.daysAgo * 3)),
      unit: "PALLET",
      storageDurationDays: 90,
      message: "Seeded fixture inquiry — not a real submission.",
      ipHash: null,
    });
  }
  console.log(`  ✓ inquiries      ${inquiryStates.length} (one per status)`);

  /* --------------------------------------------------------- documents --- */
  await db.insert(documents).values([
    {
      type: "CONTRACT",
      title: "Storage agreement — fixture",
      filename: "storage-agreement-fixture.pdf",
      // NOT NULL by design — the key points into object storage. No bytes exist
      // for a fixture, so the key is namespaced as one and nothing will resolve it.
      storageKey: "seed/fixtures/storage-agreement-fixture.pdf",
      mimeType: "application/pdf",
      sizeBytes: null,
      clientId: firstClientId,
      uploadedById: adminUser.id,
    },
    {
      type: "GATE_PASS",
      title: "Gate pass — fixture outbound load",
      filename: "gate-pass-fixture.pdf",
      storageKey: "seed/fixtures/gate-pass-fixture.pdf",
      mimeType: "application/pdf",
      sizeBytes: null,
      clientId: firstClientId,
      uploadedById: adminUser.id,
    },
    {
      type: "REPORT",
      title: "Temperature log extract — fixture",
      filename: "temperature-log-fixture.csv",
      storageKey: "seed/fixtures/temperature-log-fixture.csv",
      mimeType: "text/csv",
      sizeBytes: null,
      clientId: firstClientId,
      uploadedById: adminUser.id,
    },
  ]);
  console.log(`  ✓ documents      3 (no bytes — metadata only)`);

  /* ----------------------------------------------------- notifications --- */
  await db.insert(notifications).values([
    {
      channel: "EMAIL",
      status: "SKIPPED",
      recipient: CREDENTIALS.admin.email,
      subject: "Storage inquiry — seeded fixture",
      body: "Seeded fixture. Marked SKIPPED because no provider was configured at seed time.",
      providerMessageId: null,
      sentAt: null,
      error: "EMAIL_SERVER is not configured",
      inquiryId: null,
    },
    {
      channel: "IN_APP",
      status: "QUEUED",
      recipient: CREDENTIALS.admin.email,
      subject: "Unacknowledged critical event",
      body: "Seeded fixture — chamber door held open in A-01.",
      inquiryId: null,
    },
  ]);
  console.log(`  ✓ notifications  2`);

  /* -------------------------------------------------------- audit logs --- */
  await db.insert(auditLogs).values([
    {
      actorUserId: adminUser.id,
      action: "SEED_RUN",
      entityType: "SYSTEM",
      entityId: null,
      // audit_logs carries before/after JSONB rather than a summary string, so
      // the description of the action lives in `after`.
      before: null,
      after: {
        note: "Development fixtures seeded by npm run db:seed.",
        telemetrySource: "SIMULATION",
        zoneCapacity: null,
      },
      ipHash: null,
      userAgent: null,
    },
  ]);
  console.log(`  ✓ audit          1`);

  /* ------------------------------------------------------------ summary --- */
  console.log(
    [
      "",
      "Seed complete.",
      "",
      "  Sign in with:",
      `    ADMIN     ${CREDENTIALS.admin.email}`,
      `              ${CREDENTIALS.admin.password}`,
      `    OPERATOR  ${CREDENTIALS.operator.email}`,
      `              ${CREDENTIALS.operator.password}`,
      `    CLIENT    ${CREDENTIALS.client.email}`,
      `              ${CREDENTIALS.client.password}`,
      "",
      "  ⚠ These are development credentials. Change them before any deployment,",
      "    and never commit real ones (§03).",
      "",
      "  ⚠ All telemetry was written with source = SIMULATION and zone capacity was",
      "    left NULL. Both are deliberate (§40, §45) — do not treat seeded figures",
      "    as facility specifications.",
      "",
    ].join("\n"),
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✖ Seed failed:", error);
    process.exit(1);
  });
