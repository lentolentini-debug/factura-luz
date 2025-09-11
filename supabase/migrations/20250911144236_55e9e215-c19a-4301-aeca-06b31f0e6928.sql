-- Fix the storage bucket to be public so edge functions can access uploaded files
UPDATE storage.buckets 
SET public = true 
WHERE name = 'invoices';