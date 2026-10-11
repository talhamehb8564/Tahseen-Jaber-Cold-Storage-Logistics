/**
 * TYPED API CONTRACTS (§02)
 * ---------------------------------------------------------------------------
 * The exact shapes exchanged between the browser and route handlers. Both sides
 * import from here, so a change to a response is a compile error on the other
 * side rather than a runtime surprise.
 *
 * §39 — error responses carry a stable `code` for programmatic handling and a
 * `message` that is safe to show a visitor. Raw database or transport errors are
 * never included.
 */

export type InquiryErrorCode =
  | "invalid"
  | "rate_limited"
  | "unavailable"
  | "error";

export interface InquirySuccessResponse {
  ok: true;
  reference: string;
  /** False when the record could not be stored and only notification happened. */
  persisted: boolean;
  /** Present when `persisted` is false — the UI must show it. */
  caveat?: string;
  notified: {
    adminEmail: boolean;
    receiptEmail: boolean;
    whatsapp: boolean;
  };
}

export interface InquiryErrorResponse {
  ok: false;
  code: InquiryErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  retryAfterSeconds?: number;
}

export type InquiryResponse = InquirySuccessResponse | InquiryErrorResponse;

/* ==========================================================================
   AUTH
   ========================================================================== */

export type AuthErrorCode =
  | "invalid_credentials"
  | "inactive"
  | "forbidden"
  | "error"
  | "rate_limited"
  /** Payload failed schema validation — field errors accompany it. */
  | "invalid";

export interface SessionUserResponse {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "OPERATOR" | "CLIENT";
  /** Present for CLIENT accounts, and the only key the portal trusts. */
  clientId: string | null;
}

export interface AuthSuccessResponse {
  ok: true;
  user: SessionUserResponse;
}

export interface AuthErrorResponse {
  ok: false;
  code: AuthErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

/* ==========================================================================
   HEALTH
   ========================================================================== */

export interface HealthResponse {
  ok: boolean;
  database: "connected" | "not_configured" | "unreachable";
  dataSourceMode: "demo" | "live";
  emailConfigured: boolean;
  whatsappConfigured: boolean;
  version: string;
}

/* ==========================================================================
   ADMIN MUTATIONS
   ========================================================================== */

export type AdminErrorCode = "forbidden" | "invalid" | "not_found" | "error";

export interface AdminSuccessResponse<T = unknown> {
  ok: true;
  data: T;
}

export interface AdminErrorResponse {
  ok: false;
  code: AdminErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export type AdminResponse<T = unknown> = AdminSuccessResponse<T> | AdminErrorResponse;
