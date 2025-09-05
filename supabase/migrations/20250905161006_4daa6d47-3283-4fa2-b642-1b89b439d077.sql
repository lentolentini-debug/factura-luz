-- Create storage bucket for invoice files
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- Create RLS policies for invoice files
CREATE POLICY "Users can view their own invoice files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own invoice files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own invoice files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own invoice files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);