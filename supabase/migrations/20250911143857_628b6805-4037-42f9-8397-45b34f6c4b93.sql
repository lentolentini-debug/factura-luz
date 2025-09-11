-- Fix the storage bucket to be public so edge functions can access uploaded files
UPDATE storage.buckets 
SET public = true 
WHERE name = 'invoices';

-- Also add storage policies for better security
INSERT INTO storage.objects (bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata) VALUES ('invoices', '.emptyFolderPlaceholder', null, now(), now(), now(), '{}') ON CONFLICT DO NOTHING;

-- Allow users to view their own uploaded invoices
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command, roles)
VALUES (
  'allow_invoice_select_for_authenticated_users',
  'invoices',
  'Allow authenticated users to select invoices',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'SELECT',
  '{authenticated}'
) ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own invoices  
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command, roles)
VALUES (
  'allow_invoice_insert_for_authenticated_users', 
  'invoices',
  'Allow authenticated users to upload invoices',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'INSERT',
  '{authenticated}'
) ON CONFLICT (id) DO NOTHING;