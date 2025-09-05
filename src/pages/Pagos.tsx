import { useState, useRef, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, CalendarIcon, Search, Loader2, FileText, Upload, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { usePayments } from '@/hooks/usePayments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OCRService } from '@/lib/ocr';

export const Pagos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceSuggestions, setInvoiceSuggestions] = useState<any[]>([]);
  const [searchingInvoices, setSearchingInvoices] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [autoSearching, setAutoSearching] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { payments, loading, createPayment, findInvoiceForPayment } = usePayments();
  const { user } = useAuth();
  const { toast } = useToast();

  // Función para subir archivo de comprobante
  const uploadReceiptFile = async (file: File) => {
    if (!user) return null;

    setUploadingReceipt(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `receipts/${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: "Error",
        description: "Error al subir el comprobante",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Función para procesar comprobante con OCR y buscar factura automáticamente
  const processReceiptAndFindInvoice = async (file: File) => {
    setProcessingReceipt(true);
    setAutoSearching(true);
    
    try {
      const base64 = await OCRService.processFileToBase64(file);
      const extractedData = await OCRService.extractInvoiceData(base64);
      
      // Buscar factura basada en los datos extraídos
      const searchCriteria = {
        invoice_number: extractedData.invoice_number,
        supplier_name: extractedData.supplier?.name,
        amount: extractedData.amounts?.total,
        date_range: extractedData.issue_date && extractedData.due_date ? {
          start: extractedData.issue_date,
          end: extractedData.due_date
        } : undefined
      };

      const foundInvoices = await findInvoiceForPayment(searchCriteria);
      
      if (foundInvoices.length > 0) {
        const invoice = foundInvoices[0];
        setSelectedInvoice(invoice);
        setInvoiceSearch(`${invoice.invoice_number} - ${invoice.supplier?.name}`);
        setAmount(invoice.amount_total?.toString() || '');
        
        toast({
          title: "Factura encontrada automáticamente",
          description: `Se encontró la factura ${invoice.invoice_number}`,
        });
      } else {
        toast({
          title: "No se encontró factura",
          description: "No se pudo encontrar una factura que coincida con el comprobante",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Error",
        description: "Error al procesar el comprobante",
        variant: "destructive",
      });
    } finally {
      setProcessingReceipt(false);
      setAutoSearching(false);
    }
  };

  // Función para manejar selección de archivo de comprobante
  const handleReceiptFileSelect = async (file: File) => {
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos PDF, JPG y PNG",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no puede ser mayor a 10MB",
        variant: "destructive",
      });
      return;
    }

    setReceiptFile(file);

    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }

    // Procesar automáticamente para encontrar factura
    await processReceiptAndFindInvoice(file);
  };

  // Funciones para drag & drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        handleReceiptFileSelect(file);
      } else {
        toast({
          title: "Tipo de archivo no válido",
          description: "Por favor selecciona una imagen o PDF",
          variant: "destructive",
        });
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const filteredPayments = payments.filter(payment =>
    payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment as any).invoice?.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchInvoices = async () => {
    if (!invoiceSearch.trim()) return;

    setSearchingInvoices(true);
    try {
      const results = await findInvoiceForPayment({
        invoice_number: invoiceSearch,
        supplier_name: invoiceSearch,
      });
      setInvoiceSuggestions(results);
    } catch (error) {
      console.error('Error searching invoices:', error);
      toast({
        title: "Error",
        description: "Error al buscar facturas",
        variant: "destructive",
      });
    } finally {
      setSearchingInvoices(false);
    }
  };

  const selectInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setInvoiceSearch(`${invoice.invoice_number} - ${invoice.supplier?.name}`);
    setAmount(invoice.amount_total?.toString() || '');
    setInvoiceSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoice) {
      toast({
        title: "Error",
        description: "Debe seleccionar una factura",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Debe ingresar un monto válido",
        variant: "destructive",
      });
      return;
    }

    if (!method) {
      toast({
        title: "Error",
        description: "Debe seleccionar un método de pago",
        variant: "destructive",
      });
      return;
    }

    try {
      // Subir archivo de comprobante si existe
      let receiptFileUrl = null;
      if (receiptFile) {
        receiptFileUrl = await uploadReceiptFile(receiptFile);
      }

      const paymentData = {
        invoice_id: selectedInvoice.id,
        payment_date: paymentDate.toISOString().split('T')[0],
        amount_paid: parseFloat(amount),
        method,
        reference_number: referenceNumber || undefined,
        receipt_file_url: receiptFileUrl || undefined,
        notes: notes || undefined,
      };

      await createPayment(paymentData);
      
      toast({
        title: "Pago registrado",
        description: "El pago ha sido registrado exitosamente",
      });

      // Limpiar formulario
      setShowForm(false);
      setAmount('');
      setMethod('');
      setReferenceNumber('');
      setNotes('');
      setInvoiceSearch('');
      setSelectedInvoice(null);
      setInvoiceSuggestions([]);
      setReceiptFile(null);
      setReceiptPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "Error al registrar el pago",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div 
        className={`p-8 space-y-6 ${isDragOver ? 'bg-primary/5' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pagos</h1>
            <p className="text-muted-foreground">
              Registra y gestiona los pagos de facturas
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pago
          </Button>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de referencia, método o factura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>

        {/* Tabla de pagos */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>N° Factura</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">Cargando pagos...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? 'No se encontraron pagos que coincidan con la búsqueda' : 'No hay pagos registrados'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell className="font-medium">
                        {(payment as any).invoice?.invoice_number || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {(payment as any).invoice?.supplier?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount_paid)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{payment.method}</Badge>
                      </TableCell>
                      <TableCell>{payment.reference_number || '-'}</TableCell>
                      <TableCell>
                        {payment.receipt_file_url ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={payment.receipt_file_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="w-4 h-4" />
                            </a>
                          </Button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Modal de registro de pago */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Pago</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Comprobante de pago */}
              <div className="space-y-2">
                <Label>Comprobante de Pago (opcional)</Label>
                <div className="space-y-3">
                  {!receiptFile ? (
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragOver 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Arrastra tu comprobante aquí o
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => e.target.files?.[0] && handleReceiptFileSelect(e.target.files[0])}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingReceipt || processingReceipt}
                      >
                        {uploadingReceipt || processingReceipt ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {processingReceipt ? 'Procesando...' : 'Subiendo...'}
                          </>
                        ) : (
                          'Seleccionar archivo'
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Se buscará automáticamente la factura correspondiente
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{receiptFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                              {autoSearching && (
                                <span className="ml-2 text-primary">🔍 Buscando factura...</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setReceiptFile(null);
                            setReceiptPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {receiptPreview && (
                        <div className="border rounded-lg overflow-hidden">
                          <img 
                            src={receiptPreview} 
                            alt="Preview del comprobante" 
                            className="w-full h-32 object-contain bg-gray-50"
                          />
                        </div>
                      )}

                      {autoSearching && (
                        <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Analizando comprobante y buscando factura...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Buscar factura */}
              <div className="space-y-2">
                <Label>Buscar Factura *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por número de factura o proveedor..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    disabled={!!selectedInvoice}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={searchInvoices}
                    disabled={searchingInvoices || !!selectedInvoice}
                  >
                    {searchingInvoices ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {selectedInvoice ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">
                          {selectedInvoice.invoice_number} - {selectedInvoice.supplier?.name}
                        </p>
                        <p className="text-sm text-green-600">
                          Monto: {formatCurrency(selectedInvoice.amount_total)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(null);
                          setInvoiceSearch('');
                          setAmount('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : invoiceSuggestions.length > 0 ? (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {invoiceSuggestions.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-3 hover:bg-secondary cursor-pointer border-b last:border-b-0"
                        onClick={() => selectInvoice(invoice)}
                      >
                        <p className="font-medium">{invoice.invoice_number} - {invoice.supplier?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(invoice.amount_total)} • Estado: {invoice.status}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Fecha de pago */}
              <div className="space-y-2">
                <Label>Fecha de Pago *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !paymentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={(date) => date && setPaymentDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Monto */}
              <div className="space-y-2">
                <Label>Monto Pagado *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Método de pago */}
              <div className="space-y-2">
                <Label>Método de Pago *</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                    <SelectItem value="mercadopago">MercadoPago</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Número de referencia */}
              <div className="space-y-2">
                <Label>Número de Referencia</Label>
                <Input
                  placeholder="Número de transferencia, cheque, etc."
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setReceiptFile(null);
                    setReceiptPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={!selectedInvoice}
                >
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