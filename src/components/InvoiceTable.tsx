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
import { Eye, Edit, Trash2, Search, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface Invoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'Recibida' | 'Pendiente' | 'Pagada' | 'Vencida';
}

// Datos de ejemplo
const sampleInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'FAC-001-2024',
    supplier: 'Proveedor ABC S.A.',
    issueDate: '2024-03-01',
    dueDate: '2024-03-15',
    amount: 125000,
    status: 'Pendiente'
  },
  {
    id: '2',
    invoiceNumber: 'FAC-002-2024',
    supplier: 'Servicios XYZ Ltda.',
    issueDate: '2024-02-28',
    dueDate: '2024-03-28',
    amount: 87500,
    status: 'Pagada'
  },
  {
    id: '3',
    invoiceNumber: 'FAC-003-2024',
    supplier: 'Materiales DEF S.R.L.',
    issueDate: '2024-02-20',
    dueDate: '2024-03-05',
    amount: 195000,
    status: 'Vencida'
  },
];

const statusVariants = {
  'Recibida': 'bg-accent text-accent-foreground',
  'Pendiente': 'bg-warning text-warning-foreground',
  'Pagada': 'bg-success text-success-foreground',
  'Vencida': 'bg-destructive text-destructive-foreground',
};

export const InvoiceTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices] = useState<Invoice[]>(sampleInvoices);

  const filteredInvoices = invoices.filter(invoice =>
    invoice.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
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
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.supplier}</TableCell>
                <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
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
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};