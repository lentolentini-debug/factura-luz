import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Eye, Edit, Trash2, Search, Filter, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/use-toast';

const statusVariants = {
  'Recibida': 'bg-accent text-accent-foreground',
  'Pendiente': 'bg-warning text-warning-foreground',
  'Pagada': 'bg-success text-success-foreground',
  'Vencida': 'bg-destructive text-destructive-foreground',
};

export const InvoiceTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { invoices, loading, deleteInvoice } = useInvoices();
  const { toast } = useToast();

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la factura ${invoiceNumber}?`)) {
      try {
        await deleteInvoice(invoiceId);
        toast({
          title: "Factura eliminada",
          description: "La factura ha sido eliminada correctamente.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la factura.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    (invoice.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="shadow-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Facturas Recientes</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar facturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Factura</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Cargando facturas...</p>
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No se encontraron facturas que coincidan con la búsqueda' : 'No hay facturas registradas'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.supplier?.name || 'Sin proveedor'}</TableCell>
                  <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(invoice.amount_total)}</TableCell>
                  <TableCell>
                    <Badge className={statusVariants[invoice.status]}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteInvoice(invoice.id, invoice.invoice_number)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};