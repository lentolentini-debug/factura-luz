-- Add missing fields for Argentine invoice compliance
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS service_period_from date,
ADD COLUMN IF NOT EXISTS service_period_to date,
ADD COLUMN IF NOT EXISTS type_letter text,
ADD COLUMN IF NOT EXISTS doc_code text,
ADD COLUMN IF NOT EXISTS point_of_sale text,
ADD COLUMN IF NOT EXISTS cae_number text,
ADD COLUMN IF NOT EXISTS cae_due_date date,
ADD COLUMN IF NOT EXISTS payment_terms text,
ADD COLUMN IF NOT EXISTS bank jsonb,
ADD COLUMN IF NOT EXISTS taxes jsonb;

-- Create unique constraint for Argentine invoices
ALTER TABLE public.invoices 
ADD CONSTRAINT unique_argentine_invoice 
UNIQUE (type_letter, point_of_sale, invoice_number, supplier_id);

-- Create index for better performance on invoice lookups
CREATE INDEX IF NOT EXISTS idx_invoices_comprobante 
ON public.invoices (type_letter, point_of_sale, invoice_number);

-- Update suppliers table to include CUIT
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS cuit text;