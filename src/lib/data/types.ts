/**
 * DATA PROVIDER CONTRACT (§40)
 * ---------------------------------------------------------------------------
 * Every screen that shows facility data — the hero HUD, the facility map, the
 * telemetry charts, the inventory scanner, the security matrix, the admin
 * command center and the client portal — reads through this interface and
 * nothing else.
 *
 * That is what makes the "real vs simulated" rule enforceable rather than
 * aspirational: when real sensors are connected, a new provider is written
 * against this contract and the UI does not change.
 *
 * PROVENANCE IS PART OF THE TYPE. `simulated` is not optional and not
 * derivable at the call site — a component cannot forget to check it, and a
 * value can never be labelled "live" unless the provider asserts it.
 */

import type {
  EventSeverity,
  InquiryStatus,
  InventoryStatus,
  ProductCategory,
  TelemetrySource,
  UserRole,
  ZoneKind,
} from "@/lib/db/schema";

/** Where the numbers on screen came from. Surfaced to the visitor verbatim. */
export type DataSourceMode = "demo" | "live";

export interface DataSourceInfo {
  mode: DataSourceMode;
  /** Rendered in the UI badge. Never "LIVE" unless mode === "live". */
  badge: "SIMULATION" | "LIVE";
  /** Human-readable explanation, e.g. why the site fell back to demo. */
  reason: string;
  /** True when a real database is attached (demo data may still be shown). */
  databaseConnected: boolean;
}

export type ZoneHealth = "STABLE" | "DRIFT" | "ALERT" | "MAINTENANCE";

export interface ZoneReading {
  zoneId: string;
  code: string;
  name: string;
  kind: ZoneKind;
  temperatureC: number | null;
  humidityPercent: number | null;
  setpointC: number | null;
  /** Non-null only when the business has confirmed a figure (§45). */
  capacityPallets: number | null;
  occupiedPallets: number;
  health: ZoneHealth;
  monitoringActive: boolean;
  restrictedAccess: boolean;
  recordedAt: string;
  source: TelemetrySource;
  simulated: boolean;
}

export interface TelemetryPoint {
  at: string;
  temperatureC: number;
  humidityPercent: number;
}

export interface ZoneHistory {
  zoneId: string;
  code: string;
  points: TelemetryPoint[];
  source: TelemetrySource;
  simulated: boolean;
}

export interface FacilityEventView {
  id: string;
  zoneCode: string | null;
  zoneName: string | null;
  severity: EventSeverity;
  type: string;
  title: string;
  message: string | null;
  occurredAt: string;
  acknowledged: boolean;
  simulated: boolean;
}

export interface SecurityCameraView {
  id: string;
  zone: string;
  online: boolean;
  simulated: boolean;
}

export interface SecurityStatusView {
  accessSecured: boolean;
  monitoringActive: boolean;
  cameras: SecurityCameraView[];
  camerasOnline: number;
  camerasTotal: number;
  lastPatrolAt: string | null;
  simulated: boolean;
}

export interface InventoryItemView {
  id: string;
  batchReference: string;
  productName: string;
  category: ProductCategory;
  zoneCode: string | null;
  locationCode: string | null;
  quantity: number;
  unit: string;
  status: InventoryStatus;
  trackingActive: boolean;
  receivedAt: string | null;
  setpointC: number | null;
  clientId: string | null;
  clientName: string | null;
  simulated: boolean;
}

export interface InventorySnapshot {
  items: InventoryItemView[];
  totalBatches: number;
  totalPallets: number;
  byCategory: { category: ProductCategory; count: number }[];
  byStatus: { status: InventoryStatus; count: number }[];
  simulated: boolean;
}

export interface InquiryView {
  id: string;
  reference: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  category: ProductCategory | null;
  quantity: number | null;
  unit: string | null;
  storageDurationDays: number | null;
  message: string | null;
  status: InquiryStatus;
  source: string;
  createdAt: string;
  internalNotes: string | null;
  simulated: boolean;
}

export interface OccupancyView {
  zones: { code: string; name: string; capacity: number | null; occupied: number; health: ZoneHealth }[];
  /** Null whenever any contributing capacity is unknown (§45). */
  utilisationPercent: number | null;
  totalCapacity: number | null;
  totalOccupied: number;
  simulated: boolean;
}

export interface AnalyticsSnapshot {
  temperatureHistory: { zoneCode: string; points: TelemetryPoint[] }[];
  inquiryVolume: { period: string; count: number }[];
  inventoryDistribution: { category: ProductCategory; pallets: number }[];
  utilisationTrend: { period: string; percent: number | null }[];
  simulated: boolean;
}

export interface OverviewSnapshot {
  inquiries: { new: number; contacted: number; quoted: number; approved: number; total: number };
  occupancy: OccupancyView;
  activeStorageBatches: number;
  alerts: { critical: number; warning: number; info: number };
  inventory: { batches: number; pallets: number };
  recentActivity: FacilityEventView[];
  simulated: boolean;
}

export interface ClientPortalSnapshot {
  clientId: string;
  companyName: string;
  contactName: string | null;
  inventory: InventoryItemView[];
  requests: InquiryView[];
  documents: DocumentView[];
  invoices: InvoiceView[];
  gatePasses: GatePassView[];
  leases: LeaseView[];
  telemetry: ZoneReading[];
  simulated: boolean;
}

export interface DocumentView {
  id: string;
  type: string;
  title: string;
  filename: string;
  sizeBytes: number | null;
  createdAt: string;
  simulated: boolean;
}

export interface InvoiceView {
  id: string;
  reference: string;
  period: string;
  /** Null until the business supplies pricing (§25). */
  amount: number | null;
  currency: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  issuedAt: string;
  simulated: boolean;
}

export interface GatePassView {
  id: string;
  reference: string;
  direction: "INBOUND" | "OUTBOUND";
  vehicleRegistration: string | null;
  batchReference: string | null;
  status: "PENDING" | "APPROVED" | "RELEASED" | "CANCELLED";
  validFrom: string;
  simulated: boolean;
}

export interface LeaseView {
  id: string;
  reference: string;
  zoneCode: string | null;
  palletPositions: number;
  status: string;
  startedAt: string;
  endedAt: string | null;
  simulated: boolean;
}

/**
 * The full provider surface. `demo` and `live` implementations both satisfy it.
 *
 * All methods take an optional `viewer` so a provider can scope rows by client
 * without the caller re-implementing authorization (§29). Authorization itself
 * is still enforced in the route/action layer — never only here.
 */
export interface DataProvider {
  readonly info: DataSourceInfo;

  getZoneReadings(): Promise<ZoneReading[]>;
  getZoneHistory(zoneId: string, hours?: number): Promise<ZoneHistory>;
  getFacilityEvents(limit?: number): Promise<FacilityEventView[]>;
  getSecurityStatus(): Promise<SecurityStatusView>;
  getInventorySnapshot(clientId?: string): Promise<InventorySnapshot>;
  getInquiries(filter?: { status?: InquiryStatus; limit?: number; search?: string }): Promise<InquiryView[]>;
  getOccupancy(): Promise<OccupancyView>;
  getAnalytics(): Promise<AnalyticsSnapshot>;
  getOverview(): Promise<OverviewSnapshot>;
  getClientPortal(clientId: string): Promise<ClientPortalSnapshot>;
}

/** Roles that may enter the admin command center. Enforced server-side. */
export const ADMIN_ROLES: readonly UserRole[] = ["ADMIN"];
export const STAFF_ROLES: readonly UserRole[] = ["ADMIN", "OPERATOR"];
