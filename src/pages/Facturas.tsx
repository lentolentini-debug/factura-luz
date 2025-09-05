import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { InvoiceTable } from '@/components/InvoiceTable';
import { InvoiceForm } from '@/components/InvoiceForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

export const Facturas = () => {
  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = () => {
    // El hook useInvoices se encarga de refrescar los datos
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Facturas</h1>
            <p className="text-muted-foreground">
              Gestiona todas las facturas del sistema
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Factura
          </Button>
        </div>

        {/* Tabla de facturas */}
        <InvoiceTable />

        {/* Modal de nueva factura */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <InvoiceForm 
              onClose={() => setShowForm(false)}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};