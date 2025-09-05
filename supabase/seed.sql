-- Crear las tablas necesarias para el sistema de facturas
-- Primero habilitamos RLS en todas las tablas

-- Tabla de perfiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tax_id TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    default_currency TEXT DEFAULT 'ARS',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de facturas
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_total DECIMAL(15,2) NOT NULL CHECK (amount_total >= 0),
    currency TEXT DEFAULT 'ARS',
    net_amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    status TEXT CHECK (status IN ('Recibida', 'Pendiente', 'Pagada', 'Vencida')) DEFAULT 'Recibida',
    ocr_confidence DECIMAL(3,2),
    source_file_url TEXT,
    notes TEXT,
    needs_review BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount_paid DECIMAL(15,2) NOT NULL CHECK (amount_paid > 0),
    method TEXT NOT NULL,
    reference_number TEXT,
    receipt_file_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de adjuntos
CREATE TABLE IF NOT EXISTS attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT CHECK (entity_type IN ('invoice', 'payment')) NOT NULL,
    entity_id UUID NOT NULL,
    file_url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de recordatorios
CREATE TABLE IF NOT EXISTS reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    channel TEXT CHECK (channel IN ('email', 'in_app')) DEFAULT 'email',
    status TEXT CHECK (status IN ('scheduled', 'sent', 'failed')) DEFAULT 'scheduled'
);

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas RLS para suppliers (todos los usuarios autenticados pueden ver/crear/editar)
CREATE POLICY "Authenticated users can view suppliers" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert suppliers" ON suppliers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update suppliers" ON suppliers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete suppliers" ON suppliers FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para invoices
CREATE POLICY "Users can view all invoices" ON invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert invoices" ON invoices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update invoices" ON invoices FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete invoices" ON invoices FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para payments
CREATE POLICY "Users can view payments" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert payments" ON payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update payments" ON payments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete payments" ON payments FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para attachments
CREATE POLICY "Users can view attachments" ON attachments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert attachments" ON attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete attachments" ON attachments FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas RLS para reminders
CREATE POLICY "Users can view reminders" ON reminders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert reminders" ON reminders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update reminders" ON reminders FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas RLS para audit_log
CREATE POLICY "Users can view audit logs" ON audit_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert audit logs" ON audit_log FOR INSERT WITH CHECK (true);

-- Funciones y triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar automáticamente facturas vencidas
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void AS $$
BEGIN
    UPDATE invoices 
    SET status = 'Vencida', updated_at = NOW()
    WHERE status IN ('Recibida', 'Pendiente') 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Datos de ejemplo
INSERT INTO suppliers (name, tax_id, email, phone, address, default_currency, notes) VALUES
('Proveedor ABC S.A.', '20123456789', 'facturacion@abc.com.ar', '+54 11 4444-5555', 'Av. Corrientes 1234, CABA', 'ARS', 'Proveedor principal de insumos'),
('Servicios XYZ Ltda.', '20987654321', 'admin@xyz.com.ar', '+54 11 5555-6666', 'Av. Santa Fe 5678, CABA', 'ARS', 'Servicios de mantenimiento'),
('Materiales DEF S.R.L.', '20456789123', 'ventas@def.com.ar', '+54 11 6666-7777', 'Av. Rivadavia 9012, CABA', 'ARS', 'Materiales de construcción'),
('Tecnología GHI S.A.', '20789123456', 'facturacion@ghi.com.ar', '+54 11 7777-8888', 'Av. Cabildo 3456, CABA', 'ARS', 'Equipos tecnológicos'),
('Suministros JKL Ltda.', '20321654987', 'admin@jkl.com.ar', '+54 11 8888-9999', 'Av. Las Heras 7890, CABA', 'ARS', 'Suministros varios')
ON CONFLICT (id) DO NOTHING;

-- Facturas de ejemplo (usando IDs de suppliers recién creados)
INSERT INTO invoices (supplier_id, invoice_number, issue_date, due_date, amount_total, currency, net_amount, tax_amount, status, created_by) 
SELECT 
    s.id,
    'FC-' || LPAD((ROW_NUMBER() OVER())::text, 5, '0'),
    CURRENT_DATE - (random() * 30)::int,
    CURRENT_DATE + (random() * 60 - 30)::int,
    (random() * 500000 + 50000)::decimal(15,2),
    'ARS',
    (random() * 413000 + 41300)::decimal(15,2),
    (random() * 87000 + 8700)::decimal(15,2),
    CASE 
        WHEN random() < 0.3 THEN 'Pagada'
        WHEN random() < 0.6 THEN 'Pendiente'
        WHEN random() < 0.8 THEN 'Recibida'
        ELSE 'Vencida'
    END,
    (SELECT id FROM auth.users LIMIT 1)
FROM suppliers s, generate_series(1, 4)
ON CONFLICT (id) DO NOTHING;