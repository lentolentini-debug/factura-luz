import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JSON Schema for OpenAI Structured Outputs
const invoiceSchema = {
  type: "object",
  properties: {
    type_letter: { type: "string", enum: ["A", "B", "C"] },
    doc_code: { type: "string", enum: ["01", "06", "11"] },
    point_of_sale: { type: "string", pattern: "^[0-9]{4}$" },
    invoice_number: { type: "string", pattern: "^[0-9]{8}$" },
    comprobante_id: { type: "string" },
    issue_date: { type: "string", format: "date" },
    service_period: {
      type: "object",
      properties: {
        from: { type: "string", format: "date" },
        to: { type: "string", format: "date" }
      }
    },
    due_date: { type: "string", format: "date" },
    supplier: {
      type: "object",
      properties: {
        name: { type: "string" },
        cuit: { type: "string", pattern: "^[0-9]{11}$" }
      }
    },
    customer: {
      type: "object",
      properties: {
        name: { type: "string" },
        cuit: { type: "string", pattern: "^[0-9]{11}$" }
      }
    },
    amounts: {
      type: "object",
      properties: {
        net: { type: "number" },
        taxes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              rate: { type: "number" },
              amount: { type: "number" }
            }
          }
        },
        total: { type: "number" },
        currency_code: { type: "string", enum: ["ARS", "USD", "EUR"] }
      }
    },
    payment_terms: { type: "string" },
    bank: {
      type: "object",
      properties: {
        bank_name: { type: "string" },
        branch: { type: "string" },
        cbu: { type: "string", pattern: "^[0-9]{22}$" }
      }
    },
    cae: {
      type: "object",
      properties: {
        number: { type: "string" },
        due_date: { type: "string", format: "date" }
      }
    },
    ocr_confidence: { type: "number", minimum: 0, maximum: 1 },
    needs_review: { type: "boolean" },
    source_file_url: { type: "string" }
  },
  required: ["type_letter", "amounts", "ocr_confidence", "needs_review"]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, provider = 'openai' } = await req.json();
    
    if (!fileUrl) {
      throw new Error('fileUrl es requerido');
    }

    console.log('Extracting invoice data from:', fileUrl, 'with provider:', provider);
    
    let result = null;
    const auditLog = {
      providers_used: [],
      processing_times: {},
      final_provider: null,
      error_logs: []
    };

    // SOLO usar OpenAI - es el más preciso y confiable
    if (provider === 'openai' || !result) {
      try {
        const startTime = Date.now();
        result = await extractWithOpenAI(fileUrl);
        auditLog.processing_times.openai = Date.now() - startTime;
        auditLog.providers_used.push('openai');
        auditLog.final_provider = 'openai';
        
        console.log('✅ OpenAI extraction successful!');
        console.log('📊 Confidence:', result.ocr_confidence);
        console.log('📄 Data preview:', {
          supplier: result.supplier?.name,
          invoice_number: result.invoice_number,
          total: result.amounts?.total,
          type_letter: result.type_letter
        });
        
      } catch (error) {
        console.error('❌ OpenAI extraction failed:', error);
        auditLog.error_logs.push(`OpenAI: ${error.message}`);
      }
    }

    // Fallback básico SOLO si OpenAI falla completamente
    if (!result) {
      console.log('⚠️ OpenAI failed completely, using basic fallback');
      result = createFallbackResult(fileUrl);
      auditLog.final_provider = 'fallback';
    }

    // Validar y normalizar resultado final
    result = validateAndNormalize(result);
    
    // Agregar audit log
    result.audit_log = auditLog;

    console.log('Final extraction result:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in extract-invoice-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        needs_review: true,
        ocr_confidence: 0,
        amounts: { currency_code: "ARS", total: 0, net: 0, taxes: [] }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function extractWithOpenAI(fileUrl: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  console.log('Starting OpenAI extraction for:', fileUrl);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Eres un extractor especializado en facturas argentinas del sistema AFIP. Analiza CUIDADOSAMENTE cada imagen de factura que recibas y extrae los datos ESPECÍFICOS de ESA factura.

IMPORTANTE: Cada imagen es DIFERENTE. NO uses datos de ejemplos anteriores. Analiza SOLO lo que ves en la imagen actual.

FORMATOS ESPECÍFICOS DE FACTURAS ARGENTINAS:
- Letra del comprobante: A, B, o C (buscar en el encabezado)
- Punto de Venta: 4 dígitos (ej: 0001, 0005)
- Número de factura: 8 dígitos (ej: 00000123, 12345678)
- CUIT: 11 dígitos sin guiones (ej: 20123456789)
- CAE: código alfanumérico de autorización AFIP

PROCESO DE ANÁLISIS:
1. Lee TODOS los textos visibles en la imagen
2. Identifica la razón social del proveedor (empresa que emite)
3. Busca el CUIT del proveedor
4. Encuentra el tipo de comprobante (A, B, C)
5. Localiza punto de venta y número de factura
6. Identifica fechas de emisión y vencimiento
7. Encuentra montos: subtotal, IVA, total
8. Busca CAE si está presente

CALIDAD Y CONFIANZA:
- ocr_confidence: 0.9+ si la imagen es muy clara
- ocr_confidence: 0.7-0.8 si es legible pero con algunos desafíos
- ocr_confidence: 0.5-0.6 si la imagen tiene problemas de calidad
- needs_review: true si faltan datos críticos o hay dudas

DEVUELVE SOLO JSON VÁLIDO con los datos ESPECÍFICOS de esta factura.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analiza ESPECÍFICAMENTE esta factura argentina. Extrae ÚNICAMENTE los datos visibles en esta imagen. 

IMPORTANTE: Esta es una factura NUEVA y DIFERENTE. No uses datos de facturas anteriores. Analiza con precisión cada campo visible.

Campos a extraer si están visibles:
- Razón social del proveedor
- CUIT del proveedor  
- Tipo de comprobante (A, B, C)
- Punto de venta y número
- Fechas de emisión y vencimiento
- Montos (neto, IVA, total)
- CAE y su vencimiento

Si un campo no es claramente visible, usa null. Asigna confianza según la claridad de la imagen.`
            },
            {
              type: 'image_url',
              image_url: {
                url: fileUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "invoice_extraction",
          schema: invoiceSchema
        }
      },
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  console.log('✅ OpenAI response received');
  
  const data = await response.json();
  console.log('🔍 Raw OpenAI response:', JSON.stringify(data, null, 2));
  
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('No content in OpenAI response');
  }
  
  let extractedData;
  try {
    extractedData = JSON.parse(data.choices[0].message.content);
    console.log('📊 Parsed extraction data:', JSON.stringify(extractedData, null, 2));
  } catch (parseError) {
    console.error('❌ Failed to parse OpenAI JSON response:', data.choices[0].message.content);
    throw new Error(`Invalid JSON from OpenAI: ${parseError.message}`);
  }
  
  // Validar y normalizar datos críticos
  if (extractedData.amounts?.total) {
    extractedData.amounts.total = Number(extractedData.amounts.total);
  }
  if (extractedData.amounts?.net) {
    extractedData.amounts.net = Number(extractedData.amounts.net);
  }
  if (extractedData.amounts?.taxes) {
    extractedData.amounts.taxes = extractedData.amounts.taxes.map(tax => ({
      ...tax,
      rate: Number(tax.rate),
      amount: Number(tax.amount)
    }));
  }
  
  // Asegurar currency_code para facturas argentinas
  if (!extractedData.amounts?.currency_code) {
    if (!extractedData.amounts) extractedData.amounts = {};
    extractedData.amounts.currency_code = 'ARS';
  }
  
  // Asegurar source_file_url
  extractedData.source_file_url = fileUrl;
  
  // Generar comprobante_id si no existe pero tenemos los componentes
  if (!extractedData.comprobante_id && extractedData.type_letter && extractedData.point_of_sale && extractedData.invoice_number) {
    extractedData.comprobante_id = `${extractedData.type_letter}-${extractedData.point_of_sale}-${extractedData.invoice_number}`;
  }

  console.log('✅ Final processed data:', JSON.stringify(extractedData, null, 2));
  return extractedData;
}

async function extractWithOCRSpace(fileUrl: string) {
  console.log('Starting OCR.space extraction for:', fileUrl);
  
  const ocrSpaceApiKey = Deno.env.get('OCR_SPACE_API_KEY') || 'helloworld'; // Free tier key
  
  const response = await fetch('https://api.ocr.space/parse/imageurl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      apikey: ocrSpaceApiKey,
      url: fileUrl,
      language: 'spa',
      isOverlayRequired: 'false',
      detectOrientation: 'true',
      scale: 'true',
      isTable: 'true'
    })
  });

  const data = await response.json();
  
  if (!data.ParsedResults || data.ParsedResults.length === 0) {
    throw new Error('No text extracted from OCR.space');
  }

  const extractedText = data.ParsedResults[0].ParsedText;
  return parseArgentineInvoiceText(extractedText, fileUrl, 'ocr_space');
}

async function extractWithTesseract(fileUrl: string) {
  console.log('Starting Tesseract extraction for:', fileUrl);
  
  // Tesseract no está disponible en el entorno edge function
  // Devolvemos un resultado básico que indique que no se pudo procesar
  console.log('⚠️ Tesseract not available in edge function environment');
  
  return {
    type_letter: null,
    doc_code: null,
    point_of_sale: null,
    invoice_number: null,
    comprobante_id: null,
    issue_date: null,
    service_period: { from: null, to: null },
    due_date: null,
    supplier: { name: null, cuit: null },
    customer: { name: null, cuit: null },
    amounts: {
      net: null,
      taxes: [],
      total: null,
      currency_code: "ARS"
    },
    payment_terms: null,
    bank: { bank_name: null, branch: null, cbu: null },
    cae: { number: null, due_date: null },
    ocr_confidence: 0.1, // Muy baja confianza para indicar que no se procesó realmente
    needs_review: true,
    source_file_url: fileUrl,
    error: 'Tesseract not available in edge environment'
  };
}

function parseArgentineInvoiceText(text: string, fileUrl: string, provider: string) {
  console.log(`Parsing text from ${provider}:`, text.substring(0, 200));
  
  const result = {
    type_letter: null,
    doc_code: null,
    point_of_sale: null,
    invoice_number: null,
    comprobante_id: null,
    issue_date: null,
    service_period: { from: null, to: null },
    due_date: null,
    supplier: { name: null, cuit: null },
    customer: { name: null, cuit: null },
    amounts: {
      net: null,
      taxes: [],
      total: null,
      currency_code: "ARS"
    },
    payment_terms: null,
    bank: { bank_name: null, branch: null, cbu: null },
    cae: { number: null, due_date: null },
    ocr_confidence: 0.7,
    needs_review: false,
    source_file_url: fileUrl
  };

  // Extraer tipo de factura
  const typeMatch = text.match(/FACTURA\s*([ABC])/i) || text.match(/([ABC])\s*FACTURA/i) || text.match(/COD\.\s*0?([123])/i);
  if (typeMatch) {
    let letter = typeMatch[1].toUpperCase();
    if (['1', '2', '3'].includes(letter)) {
      letter = letter === '1' ? 'A' : letter === '2' ? 'B' : 'C';
    }
    result.type_letter = letter;
    result.doc_code = letter === 'A' ? '01' : letter === 'B' ? '06' : '11';
  }

  // Extraer punto de venta y número
  const pvMatch = text.match(/Punto\s*de\s*Venta[:\s]*([0-9]+)[\s\S]*?Comp\.?\s*Nro\.?[:\s]*([0-9]+)/i);
  if (pvMatch) {
    result.point_of_sale = pvMatch[1].padStart(4, '0');
    result.invoice_number = pvMatch[2].padStart(8, '0');
    result.comprobante_id = `${result.type_letter || 'X'}-${result.point_of_sale}-${result.invoice_number}`;
  }

  // Extraer fechas
  const issueDateMatch = text.match(/Fecha\s*de\s*Emisi[oó]n[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);
  if (issueDateMatch) {
    result.issue_date = parseDate(issueDateMatch[1]);
  }

  const dueDateMatch = text.match(/Fecha\s*de\s*Vto\.?\s*para\s*el\s*pago[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);
  if (dueDateMatch) {
    result.due_date = parseDate(dueDateMatch[1]);
  }

  // Período facturado
  const periodMatch = text.match(/Per[ií]odo\s*Facturado\s*Desde[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})\s*Hasta[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);
  if (periodMatch) {
    result.service_period.from = parseDate(periodMatch[1]);
    result.service_period.to = parseDate(periodMatch[2]);
  }

  // Extraer proveedor
  const supplierMatch = text.match(/Raz[oó]n\s*Social[:\s]*([A-ZÁÉÍÓÚ][A-Za-záéíóúñ\s&.-]+)/i);
  if (supplierMatch) {
    result.supplier.name = supplierMatch[1].trim();
  }

  // Extraer CUIT
  const cuitMatches = Array.from(text.matchAll(/(?:CUIT|C\.U\.I\.T\.)[:\s]*([0-9]{2}[-\s]?[0-9]{8}[-\s]?[0-9])/gi));
  if (cuitMatches.length > 0) {
    result.supplier.cuit = cuitMatches[0][1].replace(/[-\s]/g, '');
    if (cuitMatches.length > 1) {
      result.customer.cuit = cuitMatches[1][1].replace(/[-\s]/g, '');
    }
  }

  // Extraer montos
  const netMatch = text.match(/Importe\s*Neto\s*Gravado[:\s]*\$?\s*([0-9\.\s]+,?\d*)/i);
  if (netMatch) {
    result.amounts.net = parseAmount(netMatch[1]);
  }

  const totalMatch = text.match(/Importe\s*Total[:\s]*\$?\s*([0-9\.\s]+,?\d*)/i);
  if (totalMatch) {
    result.amounts.total = parseAmount(totalMatch[1]);
  }

  // Extraer IVA
  const ivaMatches = Array.from(text.matchAll(/IVA\s*([0-9]{1,2}(?:\.[0-9]+)?)%[:\s]*\$?\s*([0-9\.\s]+,?\d*)/gi));
  for (const match of ivaMatches) {
    const rate = parseFloat(match[1]) / 100;
    const amount = parseAmount(match[2]);
    if (amount > 0) {
      result.amounts.taxes.push({
        type: 'IVA',
        rate: rate,
        amount: amount
      });
    }
  }

  // Extraer CAE
  const caeMatch = text.match(/CAE\s*N[°º][:\s]*([0-9]+)/i);
  if (caeMatch) {
    result.cae.number = caeMatch[1];
  }

  const caeDueMatch = text.match(/Fecha\s*de\s*Vto\.?\s*(?:de\s*CAE)?[:\s]*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i);
  if (caeDueMatch) {
    result.cae.due_date = parseDate(caeDueMatch[1]);
  }

  // Ajustar confianza según provider
  if (provider === 'tesseract') {
    result.ocr_confidence = 0.6; // Menor confianza para Tesseract
  }

  return result;
}

function parseDate(dateStr: string): string {
  // Convertir DD/MM/YYYY a YYYY-MM-DD
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

function parseAmount(amountStr: string): number {
  // Normalizar formato argentino a decimal
  let cleanAmount = amountStr.replace(/\$\s?/g, '').trim();
  
  // Formato argentino: 453.750,00 o 453750,00
  if (cleanAmount.includes(',')) {
    cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
  } else if (cleanAmount.includes('.')) {
    const parts = cleanAmount.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Es decimal
    } else {
      // Son separadores de miles
      cleanAmount = cleanAmount.replace(/\./g, '');
    }
  }
  
  return parseFloat(cleanAmount) || 0;
}

function createFallbackResult(fileUrl: string) {
  return {
    type_letter: null,
    doc_code: null,
    point_of_sale: null,
    invoice_number: null,
    comprobante_id: null,
    issue_date: null,
    service_period: { from: null, to: null },
    due_date: null,
    supplier: { name: null, cuit: null },
    customer: { name: null, cuit: null },
    amounts: {
      net: null,
      taxes: [],
      total: null,
      currency_code: "ARS"
    },
    payment_terms: null,
    bank: { bank_name: null, branch: null, cbu: null },
    cae: { number: null, due_date: null },
    ocr_confidence: 0.0,
    needs_review: true,
    source_file_url: fileUrl
  };
}

function validateAndNormalize(result: any) {
  console.log('🔍 Validating and normalizing result:', JSON.stringify(result, null, 2));
  
  // Verificar campos críticos
  const criticalFields = ['type_letter', 'point_of_sale', 'invoice_number', 'amounts.total', 'supplier.name'];
  let missingCritical = false;
  const missingFields = [];

  if (!result.type_letter || !result.point_of_sale || !result.invoice_number) {
    missingCritical = true;
    if (!result.type_letter) missingFields.push('type_letter');
    if (!result.point_of_sale) missingFields.push('point_of_sale');
    if (!result.invoice_number) missingFields.push('invoice_number');
  }
  
  if (!result.amounts?.total || result.amounts.total <= 0) {
    missingCritical = true;
    missingFields.push('amounts.total');
  }
  
  if (!result.supplier?.name) {
    missingCritical = true;
    missingFields.push('supplier.name');
  }

  console.log('📊 Critical fields check:', { missingCritical, missingFields, confidence: result.ocr_confidence });

  // Marcar needs_review si faltan campos críticos o confianza baja
  if (missingCritical || result.ocr_confidence < 0.8) {
    result.needs_review = true;
    console.log('⚠️ Marked for review:', { missingCritical, lowConfidence: result.ocr_confidence < 0.8 });
  }

  // Validar consistencia de montos
  if (result.amounts?.total && result.amounts?.net && result.amounts?.taxes?.length > 0) {
    const totalTaxes = result.amounts.taxes.reduce((sum: number, tax: any) => sum + tax.amount, 0);
    const calculatedTotal = result.amounts.net + totalTaxes;
    
    console.log('💰 Amount validation:', { 
      declared_total: result.amounts.total, 
      calculated_total: calculatedTotal, 
      net: result.amounts.net, 
      taxes: totalTaxes 
    });
    
    if (Math.abs(calculatedTotal - result.amounts.total) > 1) {
      result.needs_review = true;
      console.log('⚠️ Amount inconsistency detected - marked for review');
    }
  }

  // Asegurar currency_code
  if (!result.amounts) result.amounts = {};
  if (!result.amounts.currency_code) result.amounts.currency_code = "ARS";

  // Normalizar números para evitar strings
  if (result.amounts.total) result.amounts.total = Number(result.amounts.total);
  if (result.amounts.net) result.amounts.net = Number(result.amounts.net);
  if (result.ocr_confidence) result.ocr_confidence = Number(result.ocr_confidence);

  console.log('✅ Validation complete:', JSON.stringify(result, null, 2));
  return result;
}