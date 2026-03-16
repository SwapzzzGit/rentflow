// types/setup.ts
// Shape of the wizard payload POSTed to /api/setup/complete

export interface SetupData {
  // ── Landlord profile ──────────────────────────────────────────────────────
  full_name: string;
  currency: string;          // e.g. "GBP", "USD"
  currency_symbol: string;   // e.g. "£", "$"
  country: string;           // e.g. "United Kingdom"

  // ── Property ──────────────────────────────────────────────────────────────
  property_address: string;
  property_type: string;     // e.g. "apartment", "house"
  bedrooms: number;
  monthly_rent: number;
  property_vacant: boolean;

  // ── Tenant (optional — only when property_vacant is false) ────────────────
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;

  // ── Lease dates (optional) ────────────────────────────────────────────────
  move_in_date?: string;     // ISO date string: "YYYY-MM-DD"
  lease_end_date?: string;   // ISO date string: "YYYY-MM-DD"
}
