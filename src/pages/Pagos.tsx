import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Upload, Search, Receipt, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePayments } from '@/hooks/usePayments';
import { useInvoices } from '@/hooks/useInvoices';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';

export const Pagos = () => {
  const { payments, loading, createPayment, findInvoiceForPayment } = usePayments();
  const { fetchInvoices } = useInvoices();
  
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    invoice_id: '',
    payment_date: new Date(),
    amount_paid: '',
    method: '',
    reference_number: '',
    notes: '',
  });
  
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [suggestedInvoices, setSuggestedInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const filteredPayments = payments.filter(payment =>
    payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment as any).invoice?.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchInvoices = async () => {
    if (!invoiceSearch.trim()) return;

    try {
      const results = await findInvoiceForPayment({
        invoice_number: invoiceSearch,
        supplier_name: invoiceSearch,
      });
      setSuggestedInvoices(results);
    } catch (error) {
      console.error('Error searching invoices:', error);
      toast.error('Error al buscar facturas');
    }
  };

  const selectInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setFormData(prev => ({
      ...prev,
      invoice_id: invoice.id,
      amount_paid: invoice.amount_total.toString(),
    }));
    setSuggestedInvoices([]);
    setInvoiceSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoice || !formData.amount_paid || !formData.method) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      await createPayment({
        invoice_id: formData.invoice_id,
        payment_date: formData.payment_date.toISOString().split('T')[0],
        amount_paid: parseFloat(formData.amount_paid),
        method: formData.method,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
      });

      toast.success('Pago registrado exitosamente');
      setShowForm(false);
      setSelectedInvoice(null);
      setFormData({
        invoice_id: '',
        payment_date: new Date(),
        amount_paid: '',
        method: '',
        reference_number: '',
        notes: '',
      });
      fetchInvoices(); // Actualizar facturas también
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Error al registrar el pago');
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pagos</h1>
            <p className="text-muted-foreground">
              Gestiona los pagos de facturas
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pago
          </Button>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por referencia, método o factura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredPayments.length} pago{filteredPayments.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </Card>

        {/* Tabla de pagos */}
        <Card>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Cargando pagos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {formatDate(payment.payment_date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {(payment as any).invoice?.invoice_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(payment as any).invoice?.supplier?.name}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatCurrency(payment.amount_paid)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.method}</Badge>
                    </TableCell>
                    <TableCell>
                      {payment.reference_number ? (
                        <span className="font-mono text-sm">{payment.reference_number}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Procesado
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? 'No se encontraron pagos' : 'No hay pagos registrados'}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Modal de nuevo pago */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Pago</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Búsqueda de factura */}
              <div className="space-y-2">
                <Label>Buscar Factura *</Label>
                <div className="flex gap-2">
                  <Input
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    placeholder="Número de factura o proveedor..."
                    className="flex-1"
                  />
                  <Button type="button" onClick={searchInvoices} variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {/* Facturas sugeridas */}
                {suggestedInvoices.length > 0 && (
                  <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">
                    {suggestedInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        onClick={() => selectInvoice(invoice)}
                        className="p-2 hover:bg-secondary rounded cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {invoice.supplier?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(invoice.amount_total)}</p>
                            <Badge variant="secondary">{invoice.status}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Factura seleccionada */}
                {selectedInvoice && (
                  <Card className="p-3 bg-primary/5 border-primary/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{selectedInvoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedInvoice.supplier?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(selectedInvoice.amount_total)}</p>
                        <p className="text-sm text-muted-foreground">
                          Vence: {formatDate(selectedInvoice.due_date)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha de pago */}
                <div className="space-y-2">
                  <Label>Fecha de Pago *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.payment_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.payment_date ? format(formData.payment_date, "PPP", { locale: es }) : "Selecciona fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.payment_date}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, payment_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Monto pagado */}
                <div className="space-y-2">
                  <Label htmlFor="amount_paid">Monto Pagado *</Label>
                  <Input
                    id="amount_paid"
                    type="number"
                    step="0.01"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount_paid: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Método de pago */}
                <div className="space-y-2">
                  <Label>Método de Pago *</Label>
                  <Select value={formData.method} onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="debito">Débito Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Número de referencia */}
                <div className="space-y-2">
                  <Label htmlFor="reference_number">Número de Referencia</Label>
                  <Input
                    id="reference_number"
                    value={formData.reference_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="Ej: TRF-123456"
                  />
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales sobre el pago..."
                  rows={3}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!selectedInvoice}>
                  Registrar Pago
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};