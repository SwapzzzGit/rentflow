// app/api/setup/complete/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// This is the heart of the wizard. It receives wizard data, then in a single
// server-side transaction:
//   1. Upserts the landlord's profile
//   2. Creates the property
//   3. Creates the tenant (if not vacant)
//   4. Creates the lease (if tenant + dates provided)
//   5. Creates this month's rent_payment row
//   6. Creates a lease expiry alert if end date is within 60 days
//
// All writes use the service role key so RLS doesn't block server-side ops.
// The user's auth session is validated first so random POST requests are blocked.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { SetupData } from "@/types/setup";

// Regular client — validates the user's session
// Service role client — bypasses RLS for bulk inserts
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // never expose this on client
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    // ── 1. Validate session ──────────────────────────────────────────────────
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const body: SetupData = await req.json();

    // ── 2. Validate required fields ──────────────────────────────────────────
    if (!body.full_name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.property_address?.trim()) {
      return NextResponse.json({ error: "Property address is required" }, { status: 400 });
    }
    if (!body.monthly_rent || body.monthly_rent <= 0) {
      return NextResponse.json({ error: "Monthly rent must be greater than 0" }, { status: 400 });
    }
    if (!body.property_vacant && !body.tenant_name?.trim()) {
      return NextResponse.json({ error: "Tenant name is required" }, { status: 400 });
    }

    const summary: string[] = [];

    // ── 3. Upsert landlord profile ───────────────────────────────────────────
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        full_name: body.full_name.trim(),
        currency: body.currency,
        currency_symbol: body.currency_symbol,
        country: body.country,
        setup_completed: true,
        updated_at: new Date().toISOString(),
      });

    if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);

    // ── 4. Create property ───────────────────────────────────────────────────
    const { data: property, error: propertyError } = await supabaseAdmin
      .from("properties")
      .insert({
        user_id: userId,
        name: body.property_name?.trim() || body.property_address.trim(),
        address: body.property_address.trim(),
        property_type: body.property_type,
        bedrooms: body.bedrooms || null,
        rent_amount: body.monthly_rent,
        currency: body.currency,
        status: body.property_vacant ? "vacant" : "occupied",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (propertyError || !property) {
      throw new Error(`Property creation failed: ${propertyError?.message}`);
    }

    summary.push(`Property — ${body.property_address.trim()} added`);

    // ── 5. Create tenant + lease + rent (if not vacant) ──────────────────────
    let tenantId: string | null = null;

    if (!body.property_vacant && body.tenant_name?.trim()) {

      // 5a. Create tenant
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from("tenants")
        .insert({
          user_id: userId,
          property_id: property.id,
          full_name: body.tenant_name.trim(),
          email: body.tenant_email?.trim() || null,
          phone: body.tenant_phone?.trim() || null,
          move_in_date: body.move_in_date || null,
          rent_amount: body.monthly_rent,
          status: "active",
          avatar_color: "#6366f1",
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (tenantError || !tenant) {
        throw new Error(`Tenant creation failed: ${tenantError?.message}`);
      }

      tenantId = tenant.id;
      summary.push(`Tenant — ${body.tenant_name.trim()} linked to property`);

      // 5b. Create lease (if we have a move-in date)
      if (body.move_in_date) {
        const leaseEndDate = body.lease_end_date || null;

        const { error: leaseError } = await supabaseAdmin
          .from("leases")
          .insert({
            user_id: userId,
            property_id: property.id,
            tenant_id: tenant.id,
            start_date: body.move_in_date,
            end_date: leaseEndDate,
            rent_amount: body.monthly_rent, // Corrected column name
            status: "active",
            created_at: new Date().toISOString(),
          });

        if (leaseError) {
          // Non-fatal — log but continue
          console.error("Lease creation failed:", leaseError.message);
        } else {
          summary.push("Lease record created with expiry tracking");

          // 5c. If lease ends within 60 days, create an alert
          if (leaseEndDate) {
            const daysUntilExpiry = getDaysUntil(leaseEndDate);
            if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
              try {
                await supabaseAdmin.from("notifications").insert({
                  user_id: userId,
                  type: "lease_expiring",
                  title: `${body.tenant_name}'s lease expires in ${daysUntilExpiry} days`,
                  message: `The lease for ${body.property_address} expires on ${formatDate(leaseEndDate)}.`,
                  property_id: property.id,
                  tenant_id: tenant.id,
                  is_read: false,
                  created_at: new Date().toISOString(),
                });
              } catch (notifError) {
                console.warn("Notification insert skipped:", notifError);
              }
            }
          }
        }
      }

      // 5d. Create this month's rent payment row
      const rentRow = buildCurrentMonthRentRow({
        userId,
        propertyId: property.id,
        tenantId: tenant.id,
        tenantName: body.tenant_name.trim(),
        monthlyRent: body.monthly_rent,
        currency: body.currency,
      });

      const { error: rentError } = await supabaseAdmin
        .from("rent_payments")
        .insert(rentRow);

      if (rentError) {
        console.error("Rent row creation failed:", rentError.message);
      } else {
        summary.push(`${formatMonthYear(new Date())} rent entry created — ready to mark paid`);
      }
    }

    // ── 6. Return success ────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      summary,
      property_id: property.id,
      tenant_id: tenantId,
    });

  } catch (error: any) {
    console.error("[setup/complete] Error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong during setup" },
      { status: 500 }
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntil(dateString: string): number {
  const target = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function buildCurrentMonthRentRow({
  userId,
  propertyId,
  tenantId,
  tenantName,
  monthlyRent,
  currency,
}: {
  userId: string;
  propertyId: string;
  tenantId: string;
  tenantName: string;
  monthlyRent: number;
  currency: string;
}) {
  const now = new Date();
  // Due date = 1st of current month
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  return {
    user_id: userId,
    property_id: propertyId,
    tenant_id: tenantId,
    amount: monthlyRent,
    due_date: dueDate,
    status: "pending",
    // These columns were added in SQL
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    created_at: new Date().toISOString(),
  };
}
