import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  default_currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  supplier_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount_total: number;
  currency: string;
  net_amount?: number;
  tax_amount?: number;
  status: 'Recibida' | 'Pendiente' | 'Pagada' | 'Vencida';
  ocr_confidence?: number;
  source_file_url?: string;
  notes?: string;
  needs_review?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface Payment {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount_paid: number;
  method: string;
  reference_number?: string;
  receipt_file_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload_json: any;
  created_at: string;
}