import { supabase } from '@/integrations/supabase/client';

// Servicio de OCR mejorado con OpenAI, OCR.space y Tesseract como fallbacks
export class OCRService {
  static async extractInvoiceDataFromFile(fileUrl: string): Promise<{
    type_letter?: string;
    doc_code?: string;
    point_of_sale?: string;
    invoice_number?: string;
    comprobante_id?: string;
    issue_date?: string;
    service_period?: { from?: string; to?: string };
    due_date?: string;
    supplier?: {
      name?: string;
      cuit?: string;
    };
    customer?: {
      name?: string;
      cuit?: string;
    };
    amounts?: {
      net?: number;
      taxes?: Array<{ type: string; rate: number; amount: number }>;
      total?: number;
      currency_code?: string;
    };
    payment_terms?: string;
    bank?: {
      bank_name?: string;
      branch?: string;
      cbu?: string;
    };
    cae?: {
      number?: string;
      due_date?: string;
    };
    ocr_confidence: number;
    needs_review?: boolean;
    source_file_url?: string;
    audit_log?: any;
  }> {
    try {
      console.log('Extracting invoice data from file URL:', fileUrl);
      
      const { data, error } = await supabase.functions.invoke('extract-invoice-data', {
        body: { 
          fileUrl: fileUrl,
          provider: 'openai'
        }
      });

      if (error) {
        console.error('Error invoking extract-invoice-data function:', error);
        throw new Error(`Extraction failed: ${error.message}`);
      }

      console.log('Extraction result:', data);
      return data;
    } catch (error) {
      console.error('Error in extractInvoiceDataFromFile:', error);
      
      // Fallback básico si la función falla completamente
      return {
        type_letter: undefined,
        doc_code: undefined,
        point_of_sale: undefined,
        invoice_number: undefined,
        comprobante_id: undefined,
        issue_date: undefined,
        service_period: { from: undefined, to: undefined },
        due_date: undefined,
        supplier: { name: undefined, cuit: undefined },
        customer: { name: undefined, cuit: undefined },
        amounts: {
          net: undefined,
          taxes: [],
          total: undefined,
          currency_code: 'ARS'
        },
        payment_terms: undefined,
        bank: { bank_name: undefined, branch: undefined, cbu: undefined },
        cae: { number: undefined, due_date: undefined },
        ocr_confidence: 0.0,
        needs_review: true,
        source_file_url: fileUrl
      };
    }
  }

  // Función legacy para compatibilidad
  static async extractInvoiceData(imageBase64: string, apiKey?: string): Promise<any> {
    // Para mantener compatibilidad con código existente
    // En el futuro, migrar todo a extractInvoiceDataFromFile
    try {
      // Convertir base64 a blob y subirlo temporalmente
      const response = await fetch(imageBase64);
      const blob = await response.blob();
      
      // Subir temporalmente a Supabase para obtener URL
      const fileExt = blob.type.split('/')[1];
      const fileName = `temp/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      const result = await this.extractInvoiceDataFromFile(publicUrl);
      
      // Limpiar archivo temporal después de un tiempo
      setTimeout(() => {
        supabase.storage.from('invoices').remove([fileName]);
      }, 60000); // 1 minuto
      
      return result;
    } catch (error) {
      console.error('Error in legacy extractInvoiceData:', error);
      return {
        ocr_confidence: 0.0,
        needs_review: true,
        amounts: { currency_code: 'ARS', total: 0, net: 0, taxes: [] }
      };
    }
  }

  // Función para procesar archivo a base64 (compatibilidad)
  static processFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}