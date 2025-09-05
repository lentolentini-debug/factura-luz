import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, X, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useInvoices } from '@/hooks/useInvoices';
import { toast } from 'sonner';
import { OCRService } from '@/lib/ocr';

interface InvoiceFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const InvoiceForm = ({ onClose, onSuccess }: InvoiceFormProps) => {
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { createInvoice } = useInvoices();
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_number: '',
    issue_date: new Date(),
    due_date: new Date(),
    amount_total: '',
    currency: 'ARS',
    net_amount: '',
    tax_amount: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [showExtractedData, setShowExtractedData] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede ser mayor a 10MB');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Solo se permiten archivos PDF, JPG y PNG');
        return;
      }
      
      setFile(selectedFile);
      
      // Procesar OCR automáticamente
      setIsProcessingOCR(true);
      try {
        const base64 = await OCRService.processFileToBase64(selectedFile);
        console.log('Processing file with OCR...');
        
        const extractedData = await OCRService.extractInvoiceData(base64);
        console.log('OCR extracted data:', extractedData);
        
        setOcrData(extractedData);
        
        // Auto-rellenar campos con datos extraídos
        if (extractedData.amounts?.total) {
          setFormData(prev => ({ ...prev, amount_total: extractedData.amounts.total.toString() }));
        }
        
        if (extractedData.issue_date) {
          setFormData(prev => ({ ...prev, issue_date: new Date(extractedData.issue_date) }));
        }
        
        if (extractedData.due_date) {
          setFormData(prev => ({ ...prev, due_date: new Date(extractedData.due_date) }));
        }
        
        if (extractedData.invoice_number) {
          setFormData(prev => ({ ...prev, invoice_number: extractedData.invoice_number }));
        }
        
        if (extractedData.amounts?.net) {
          setFormData(prev => ({ ...prev, net_amount: extractedData.amounts.net.toString() }));
        }
        
        if (extractedData.amounts?.taxes?.length > 0) {
          const totalTax = extractedData.amounts.taxes.reduce((sum: number, tax: any) => sum + tax.amount, 0);
          setFormData(prev => ({ ...prev, tax_amount: totalTax.toString() }));
        }
        
        setShowExtractedData(true);
        
        if (extractedData.needs_review) {
          toast.warning('Algunos datos requieren revisión manual. Por favor verifica la información extraída.');
        } else {
          toast.success('Datos extraídos automáticamente de la factura');
        }
        
      } catch (error) {
        console.error('Error processing OCR:', error);
        toast.error('Error al procesar la factura. Completa los datos manualmente.');
      } finally {
        setIsProcessingOCR(false);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setOcrData(null);
    setShowExtractedData(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id || !formData.invoice_number || !formData.amount_total) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const invoiceData = {
        supplier_id: formData.supplier_id,
        invoice_number: formData.invoice_number,
        issue_date: formData.issue_date.toISOString().split('T')[0],
        due_date: formData.due_date.toISOString().split('T')[0],
        amount_total: parseFloat(formData.amount_total),
        currency: formData.currency,
        net_amount: formData.net_amount ? parseFloat(formData.net_amount) : undefined,
        tax_amount: formData.tax_amount ? parseFloat(formData.tax_amount) : undefined,
        notes: formData.notes || undefined,
      };

      await createInvoice(invoiceData);
      
      toast.success('Factura creada exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Error al crear la factura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Nueva Factura</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload de archivo */}
        <div className="space-y-2">
          <Label>Archivo de Factura (opcional)</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            {file ? (
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm text-foreground">{file.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Arrastra tu factura aquí o haz clic para seleccionar
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm">
                    Seleccionar archivo
                  </Button>
                </Label>
              </div>
            )}
          </div>
          
          {/* Procesando OCR */}
          {isProcessingOCR && (
            <div className="flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-2"></div>
              Procesando factura con OCR...
            </div>
          )}
          
          {/* Datos extraídos */}
          {showExtractedData && ocrData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-green-800 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  Datos Extraídos
                </h3>
                {ocrData.needs_review && (
                  <div className="flex items-center text-amber-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    <span className="text-xs">Requiere revisión</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {ocrData.supplier?.name && (
                  <div><strong>Proveedor:</strong> {ocrData.supplier.name}</div>
                )}
                {ocrData.invoice_number && (
                  <div><strong>Número:</strong> {ocrData.invoice_number}</div>
                )}
                {ocrData.issue_date && (
                  <div><strong>Emisión:</strong> {ocrData.issue_date}</div>
                )}
                {ocrData.due_date && (
                  <div><strong>Vencimiento:</strong> {ocrData.due_date}</div>
                )}
                {ocrData.amounts?.total && (
                  <div><strong>Total:</strong> ${ocrData.amounts.total.toLocaleString('es-AR')}</div>
                )}
                {ocrData.amounts?.net && (
                  <div><strong>Neto:</strong> ${ocrData.amounts.net.toLocaleString('es-AR')}</div>
                )}
              </div>
              <div className="mt-2 text-xs text-green-600">
                Confianza OCR: {Math.round((ocrData.ocr_confidence || 0) * 100)}%
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Proveedor */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor *</Label>
            <Select 
              value={formData.supplier_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
              disabled={suppliersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proveedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Número de factura */}
          <div className="space-y-2">
            <Label htmlFor="invoice_number">Número de Factura *</Label>
            <Input
              id="invoice_number"
              value={formData.invoice_number}
              onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
              placeholder="FC-00001"
              required
            />
          </div>

          {/* Fecha de emisión */}
          <div className="space-y-2">
            <Label>Fecha de Emisión *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.issue_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.issue_date ? format(formData.issue_date, "PPP", { locale: es }) : "Selecciona fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.issue_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, issue_date: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Fecha de vencimiento */}
          <div className="space-y-2">
            <Label>Fecha de Vencimiento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(formData.due_date, "PPP", { locale: es }) : "Selecciona fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, due_date: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Monto total */}
          <div className="space-y-2">
            <Label htmlFor="amount_total">Monto Total *</Label>
            <Input
              id="amount_total"
              type="number"
              step="0.01"
              value={formData.amount_total}
              onChange={(e) => setFormData(prev => ({ ...prev, amount_total: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          {/* Moneda */}
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                <SelectItem value="USD">Dólar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Neto */}
          <div className="space-y-2">
            <Label htmlFor="net_amount">Monto Neto</Label>
            <Input
              id="net_amount"
              type="number"
              step="0.01"
              value={formData.net_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, net_amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          {/* Impuestos */}
          <div className="space-y-2">
            <Label htmlFor="tax_amount">Impuestos</Label>
            <Input
              id="tax_amount"
              type="number"
              step="0.01"
              value={formData.tax_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, tax_amount: e.target.value }))}
              placeholder="0.00"
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
            placeholder="Notas adicionales sobre la factura..."
            rows={3}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Factura'}
          </Button>
        </div>
      </form>
    </Card>
  );
};