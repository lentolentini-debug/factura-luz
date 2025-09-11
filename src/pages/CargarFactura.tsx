import { useState, useRef, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, Image, Loader2, CheckCircle, AlertTriangle, Edit3, X } from 'lucide-react';
import { toast } from 'sonner';
import { OCRService } from '@/lib/ocr';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';

export const CargarFactura = () => {
  const { suppliers, findOrCreateSupplier } = useSuppliers();
  const { createInvoice } = useInvoices();
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [ocrData, setOcrData] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Solo se permiten archivos PDF, JPG y PNG');
      return;
    }

    // Validar tamaño (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 10MB');
      return;
    }

    setFile(selectedFile);

    // Crear preview para imágenes
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    // Subir archivo a Supabase Storage
    await uploadFile(selectedFile);
    
    // Procesar automáticamente
    await processFile(selectedFile);
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      toast.error('Debes estar autenticado para subir archivos');
      return null;
    }

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (error) throw error;

      // Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      setUploadedFileUrl(publicUrl);
      toast.success('Archivo subido exitosamente');
      return data.path;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const processFile = async (file: File) => {
    if (!uploadedFileUrl) {
      toast.error('Primero debe subirse el archivo');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      toast.info('Procesando archivo con OpenAI + fallbacks...');
      
      const extractedData = await OCRService.extractInvoiceDataFromFile(uploadedFileUrl);
      
      // Mapear datos al formato esperado por el componente
      setOcrData({
        supplier_name: extractedData.supplier?.name,
        invoice_number: extractedData.invoice_number,
        issue_date: extractedData.issue_date,
        due_date: extractedData.due_date,
        amount_total: extractedData.amounts?.total,
        currency: extractedData.amounts?.currency_code || 'ARS',
        net_amount: extractedData.amounts?.net,
        tax_amount: extractedData.amounts?.taxes?.reduce((sum, tax) => sum + tax.amount, 0) || 0,
        ocr_confidence: extractedData.ocr_confidence,
        needs_review: extractedData.needs_review,
        comprobante_id: extractedData.comprobante_id,
        supplier_cuit: extractedData.supplier?.cuit,
        cae_number: extractedData.cae?.number,
        cae_due_date: extractedData.cae?.due_date,
        audit_log: extractedData.audit_log
      });
      
      if (extractedData.ocr_confidence >= 0.8) {
        toast.success(`Datos extraídos con alta confianza (${Math.round(extractedData.ocr_confidence * 100)}%)`);
        if (extractedData.audit_log?.final_provider) {
          toast.info(`Procesado con: ${extractedData.audit_log.final_provider.toUpperCase()}`);
        }
      } else {
        toast.warning(`Datos extraídos con baja confianza (${Math.round(extractedData.ocr_confidence * 100)}%). Revisa antes de guardar.`);
        setEditMode(true);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error al procesar el archivo. Revisa los datos manualmente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!ocrData) return;

    try {
      // Buscar o crear proveedor
      let supplier;
      if (ocrData.supplier_name) {
        supplier = await findOrCreateSupplier(ocrData.supplier_name);
      } else {
        toast.error('Debe especificar un proveedor');
        return;
      }

      // Crear factura
      const invoiceData = {
        supplier_id: supplier.id,
        invoice_number: ocrData.invoice_number || `FC-${Date.now()}`,
        issue_date: ocrData.issue_date || new Date().toISOString().split('T')[0],
        due_date: ocrData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount_total: ocrData.amount_total || 0,
        currency: ocrData.currency || 'ARS',
        net_amount: ocrData.net_amount,
        tax_amount: ocrData.tax_amount,
        ocr_confidence: ocrData.ocr_confidence,
        source_file_url: uploadedFileUrl,
        notes: ocrData.ocr_confidence < 0.8 ? 'Procesado con OCR - Revisar datos' : undefined,
        needs_review: ocrData.ocr_confidence < 0.8,
      };

      await createInvoice(invoiceData);
      
      toast.success('Factura creada exitosamente');
      
      // Limpiar formulario
      setFile(null);
      setPreview(null);
      setOcrData(null);
      setEditMode(false);
      setUploadedFileUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Error al guardar la factura');
    }
  };

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileSelect(files[0]);
    }
  }, []);

  const updateOcrData = (field: string, value: any) => {
    setOcrData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cargar Factura</h1>
          <p className="text-muted-foreground">
            Sube una imagen o PDF de la factura para extraer datos automáticamente
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">1. Subir Archivo</h3>
              
              {!file ? (
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    isDragOver 
                      ? 'border-primary bg-primary/5 scale-105' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                    isDragOver ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <h4 className="text-lg font-medium mb-2">
                    {isDragOver ? '¡Suelta tu factura aquí!' : 'Arrastra tu factura aquí'}
                  </h4>
                  <p className="text-muted-foreground mb-4">
                    o haz clic para seleccionar un archivo
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    variant="outline" 
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      'Seleccionar archivo'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, JPG, PNG hasta 10MB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      {file.type.startsWith('image/') ? (
                        <Image className="w-6 h-6 text-primary" />
                      ) : (
                        <FileText className="w-6 h-6 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                          {uploadedFileUrl && (
                            <span className="ml-2 text-green-600">✓ Subido</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setOcrData(null);
                        setUploadedFileUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {preview && (
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-full h-48 object-contain bg-gray-50"
                      />
                    </div>
                  )}

                  {(isProcessing || isUploading) && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>
                        {isUploading ? 'Subiendo archivo...' : 'Procesando con OCR...'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Datos Extraídos */}
          {ocrData && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">2. Datos Extraídos</h3>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={ocrData.ocr_confidence >= 0.8 ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {ocrData.ocr_confidence >= 0.8 ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {Math.round(ocrData.ocr_confidence * 100)}% confianza
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditMode(!editMode)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Proveedor</Label>
                      <Input
                        value={ocrData.supplier_name || ''}
                        onChange={(e) => updateOcrData('supplier_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Número de Factura</Label>
                      <Input
                        value={ocrData.invoice_number || ''}
                        onChange={(e) => updateOcrData('invoice_number', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Fecha Emisión</Label>
                        <Input
                          type="date"
                          value={ocrData.issue_date || ''}
                          onChange={(e) => updateOcrData('issue_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Fecha Vencimiento</Label>
                        <Input
                          type="date"
                          value={ocrData.due_date || ''}
                          onChange={(e) => updateOcrData('due_date', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Monto Total</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={ocrData.amount_total || ''}
                        onChange={(e) => updateOcrData('amount_total', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Proveedor:</span>
                        <p className="font-medium">{ocrData.supplier_name || 'No detectado'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Número:</span>
                        <p className="font-medium">{ocrData.invoice_number || 'No detectado'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Emisión:</span>
                        <p className="font-medium">{ocrData.issue_date || 'No detectado'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vencimiento:</span>
                        <p className="font-medium">{ocrData.due_date || 'No detectado'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <p className="font-medium text-lg">
                          {ocrData.amount_total ? formatCurrency(ocrData.amount_total) : 'No detectado'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Moneda:</span>
                        <p className="font-medium">{ocrData.currency || 'ARS'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveInvoice}
                    className="flex-1"
                    disabled={!ocrData.supplier_name || !ocrData.amount_total}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Crear Factura
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};