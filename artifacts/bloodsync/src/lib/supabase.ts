import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) in Replit Secrets.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const VERIFICATION_BUCKET = "verification-docs";

// ─── Domain types (mirrors init.sql tables) ──────────────────────────────────
export interface Donor {
  id: number;
  name: string;
  blood_group: string;
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

export interface DonationVerification {
  id: number;
  donor_id: number;
  recipient_details: string;
  proof_document_url: string | null;
  verification_status: "pending" | "verified" | "rejected";
  created_at: string;
}
