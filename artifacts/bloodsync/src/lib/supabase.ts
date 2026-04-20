import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const MISSING_MSG =
  "Supabase isn't configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Replit Secrets, then restart the app.";

let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error(MISSING_MSG);
  if (!_client) _client = createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

/**
 * Proxy so existing call sites (`supabase.from(...)`, `supabase.storage...`)
 * keep working unchanged. Throws a friendly error only when actually used
 * without configuration — the app itself still loads.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const VERIFICATION_BUCKET = "verification-docs";

// ─── Domain types (mirrors init.sql tables) ──────────────────────────────────
export interface Donor {
  id: number;
  name: string;
  blood_group: string;
  division: string;
  district: string;
  whatsapp_number: string;
  smoker: boolean;
  last_donation_date: string | null;
  is_willing_to_donate: boolean;
  total_requests_received: number;
  successful_donations: number;
  created_at: string;
}

export interface DonationRequest {
  id: number;
  donor_id: number;
  requester_identifier: string;
  status: string;
  created_at: string;
}

export interface Blog {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  cover_url: string | null;
  author_uid: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DonationVerification {
  id: number;
  donor_id: number;
  recipient_details: string;
  proof_document_url: string | null;
  verification_status: "pending" | "verified" | "rejected";
  created_at: string;
}
