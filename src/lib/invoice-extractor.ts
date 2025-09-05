/*
  Base extractor de facturas – universal y AR-friendly
  ----------------------------------------------------
  Objetivo: darte una función única "extractInvoice" que puedas usar como base
  para analizar CUALQUIER factura y devolver SIEMPRE este JSON normalizado:

    {
      razon_social: string | null,
      fecha_emision: string | null,       // ISO YYYY-MM-DD
      fecha_vencimiento: string | null,   // ISO YYYY-MM-DD
      monto_total: number | null,         // número en decimal (p.ej., 453750)
      raw?: { text?: string, provider?: string, meta?: any }
    }

  Cómo usar (mínimo):
    const result = await extractInvoice({ textOverride: textoPlanoOCRoProveedor });

  Integración recomendada en Lovable:
    1) Sube el archivo (PDF/imagen) con el componente de File Upload.
    2) Convierte a texto (con el proveedor que prefieras) y pásalo a extractInvoice.
       - Si usas Google Document AI / AWS Textract / Azure: mapea el texto/JSON al campo textOverride o implementa un adapter.
    3) Muestra el JSON en tu UI.

  Extras:
    - Detecta y decodifica QR AFIP si el texto incluye la URL (mejora fecha_emision y monto_total).
    - Heurísticas robustas en español (AR) para fechas, total y razón social.
    - Normaliza fechas y montos con formatos comunes en Argentina.

  NOTA: Este archivo es autocontenido (sin dependencias externas). Si te conectás
  a un proveedor, completá las funciones stub en la sección "Proveedores".
*/

// ===== Tipos de datos de salida =====
export type InvoiceExtract = {
  razon_social: string | null;
  fecha_emision: string | null;      // YYYY-MM-DD
  fecha_vencimiento: string | null;  // YYYY-MM-DD
  monto_total: number | null;
  raw?: { text?: string; provider?: string; meta?: any };
};

// ===== Opciones de extracción =====
export type ExtractOptions = {
  // Si ya tenés el texto plano (de OCR o de un provider), pasalo acá y listo
  textOverride?: string;
  // Preferencia para "razón social": 'emisor' (default) o 'receptor'
  rolePreference?: 'emisor' | 'receptor';
  // (Opcional) Elegir proveedor (si querés llamar APIs específicas)
  provider?: 'google' | 'aws' | 'azure' | 'none';
  // (Opcional) Payload del proveedor (credentials, projectId, etc.)
  providerConfig?: any;
};

// ====== Punto de entrada principal ======
export async function extractInvoice(opts: ExtractOptions): Promise<InvoiceExtract> {
  const rolePref = opts.rolePreference ?? 'emisor';

  // 1) Conseguir texto base
  let text = sanitizeText(opts.textOverride ?? '');

  if (!text && opts.provider && opts.provider !== 'none') {
    text = await getTextFromProvider(opts.provider, opts.providerConfig);
  }

  // 2) Parser heurístico sobre el texto
  const base = parseHeuristics(text, { rolePreference: rolePref });

  // 3) QR AFIP override si existe
  const qr = tryDecodeAfipQr(text);
  if (qr) {
    // Use los campos confiables del QR cuando falten o para reforzar
    base.fecha_emision = base.fecha_emision || qr.fecha || null;
    if (qr.importe != null && (base.monto_total == null || base.monto_total <= 0)) {
      base.monto_total = qr.importe;
    }
  }

  // 4) Normalización final y bounds
  base.fecha_emision = normalizeDate(base.fecha_emision);
  base.fecha_vencimiento = normalizeDate(base.fecha_vencimiento);
  base.monto_total = normalizeAmount(base.monto_total);

  return {
    razon_social: base.razon_social ?? null,
    fecha_emision: base.fecha_emision ?? null,
    fecha_vencimiento: base.fecha_vencimiento ?? null,
    monto_total: base.monto_total ?? null,
    raw: { text, provider: opts.provider ?? 'none' }
  };
}

// =============================================================
//                Sección: Proveedores (stubs)
// =============================================================
// Si querés conectar Google/AWS/Azure, completá estas funciones.
// La idea: que devuelvan TEXTO PLANO decente (o un JSON mapeado a texto).

async function getTextFromProvider(provider: string, cfg: any): Promise<string> {
  switch (provider) {
    case 'google':
      return await googleInvoiceText(cfg);
    case 'aws':
      return await awsInvoiceText(cfg);
    case 'azure':
      return await azureInvoiceText(cfg);
    default:
      return '';
  }
}

async function googleInvoiceText(cfg: any): Promise<string> {
  // TODO: implementar llamada a Document AI Invoice Parser y consolidar el texto.
  // Debe devolver un string con todo el contenido textual relevante.
  // Ej.: concatenar fields, line items y header/footer.
  return '';
}

async function awsInvoiceText(cfg: any): Promise<string> {
  // TODO: implementar llamada a Textract AnalyzeExpense y consolidar el texto.
  return '';
}

async function azureInvoiceText(cfg: any): Promise<string> {
  // TODO: implementar llamada a Azure Document Intelligence (prebuilt-invoice) y consolidar el texto.
  return '';
}

// =============================================================
//                Sección: Heurísticas base
// =============================================================

type HeurOpts = { rolePreference: 'emisor' | 'receptor' };

type HeurOut = {
  razon_social?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  monto_total?: number;
};

function parseHeuristics(text: string, opts: HeurOpts): HeurOut {
  const out: HeurOut = {};
  if (!text) return out;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const lower = (s: string) => normalizeSpaces(s).toLowerCase();

  // --- Diccionarios de etiquetas comunes (ES/AR) ---
  const emisLabels = [
    'fecha de emisión', 'fecha de emision', 'f. emisión', 'f. emision', 'emisión', 'emision', 'fecha emisión', 'fecha emision', 'fecha'
  ];
  const vencLabels = [
    'fecha de vencimiento', 'fecha vencimiento', 'vencimiento', 'f. vto', 'f. vencimiento', 'vto', 'venc.'
  ];
  const totalLabels = [
    'total a pagar', 'importe total', 'total factura', 'total final', 'total a cobrar', 'total a pagar', 'total'
  ];
  const razonLabelsEmisor = [
    'razón social', 'razon social', 'denominación', 'denominacion', 'emisor', 'proveedor'
  ];
  const razonLabelsReceptor = [
    'razón social', 'razon social', 'denominación', 'denominacion', 'receptor', 'cliente', 'señor/es', 'senor/es', 'señores', 'senores'
  ];

  // --- Buscar FECHAS ---
  out.fecha_emision = findDateNearLabels(lines, emisLabels) || findFirstDate(lines);
  out.fecha_vencimiento = findDateNearLabels(lines, vencLabels);

  // --- Buscar TOTAL ---
  out.monto_total = findAmountNearLabels(lines, totalLabels);
  if (out.monto_total == null) {
    // fallback: buscar el mayor monto en el documento (suele ser el total)
    out.monto_total = findMaxAmount(lines);
  }

  // --- Buscar RAZÓN SOCIAL ---
  const razonLabels = opts.rolePreference === 'receptor' ? razonLabelsReceptor : razonLabelsEmisor;
  out.razon_social = findRazonSocial(lines, razonLabels, opts.rolePreference) || findHeaderName(lines);

  return out;
}

// =============================================================
//           Utilidades: fechas, montos, labels, QR AFIP
// =============================================================

function sanitizeText(t: string): string {
  if (!t) return '';
  return t.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+$/g, '').trim();
}

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// --- Fechas ---
const MONTHS_ES: Record<string, string> = {
  'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
  'julio': '07', 'agosto': '08', 'septiembre': '09', 'setiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
};

function normalizeDate(s?: string | null): string | null {
  if (!s) return null;
  const v = s.trim();
  // ISO ya
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // dd/mm/yyyy o dd-mm-yyyy
  let m = v.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  // yyyy/mm/dd o yyyy-mm-dd con separadores raros
  m = v.match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  // "1 de agosto de 2025" -> 2025-08-01
  m = v.toLowerCase().match(/(\d{1,2})\s+de\s+([a-záéíóúñ]+)(?:\s+de)?\s+(\d{4})/i);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = MONTHS_ES[normalizeSpaces(m[2]).normalize('NFD').replace(/\p{Diacritic}/gu, '')] || '01';
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

function findDateNearLabels(lines: string[], labels: string[]): string | undefined {
  // Buscamos línea con etiqueta y tomamos fecha en la misma o en las siguientes 2 líneas
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const l = L.toLowerCase();
    if (labels.some((lab) => l.includes(lab))) {
      // fecha en la misma línea
      const d = pickDateFromString(L) || pickDateFromString(lines[i+1]) || pickDateFromString(lines[i+2]);
      if (d) return d;
    }
  }
  return undefined;
}

function findFirstDate(lines: string[]): string | undefined {
  for (const L of lines) {
    const d = pickDateFromString(L);
    if (d) return d;
  }
  return undefined;
}

function pickDateFromString(s?: string): string | undefined {
  if (!s) return undefined;
  // dd/mm/yyyy o dd-mm-yyyy
  let m = s.match(/\b(\d{2}[\/-]\d{2}[\/-]\d{4})\b/);
  if (m) return m[1];
  // yyyy-mm-dd o yyyy/mm/dd
  m = s.match(/\b(\d{4}[\/-]\d{2}[\/-]\d{2})\b/);
  if (m) return m[1];
  // "d de mes de yyyy"
  m = s.toLowerCase().match(/\b(\d{1,2}\s+de\s+[a-záéíóúñ]+(?:\s+de)?\s+\d{4})\b/i);
  if (m) return m[1];
  return undefined;
}

// --- Montos ---
function parseAmountAr(s: string): number | null {
  if (!s) return null;
  // Quitar moneda y basura
  let t = s
    .replace(/\s/g, '')
    .replace(/(ars|ar\$|\$|usd|u\$s|u\$d)/ig, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '') // puntos de miles
    .replace(/,/g, '.'); // coma decimal -> punto

  const m = t.match(/(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return isFinite(n) ? n : null;
}

function findAmountNearLabels(lines: string[], labels: string[]): number | undefined {
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const l = L.toLowerCase();
    if (labels.some((lab) => l.includes(lab))) {
      // Buscar monto en la misma o próximas líneas
      const cand = [L, lines[i+1], lines[i+2]]
        .map((x) => (x ? pickAmountFromString(x) : null))
        .find((v) => v != null);
      if (cand != null) return cand;
    }
  }
  return undefined;
}

function pickAmountFromString(s: string): number | null {
  // Busca el primer número tipo AR (con puntos de miles y coma decimal)
  // Ej: 453.750,00  |  $ 12.345  |  AR$ 1.234.567,89
  const m = s.match(/([$A-Z]{0,4}\s*)?\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})?/g);
  if (!m) return null;
  // Elegir el candidato más largo (suele ser el total)
  const best = m.sort((a, b) => b.length - a.length)[0];
  return parseAmountAr(best);
}

function findMaxAmount(lines: string[]): number | undefined {
  let max: number | undefined;
  for (const L of lines) {
    const nums = L.match(/\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})?/g) || [];
    for (const s of nums) {
      const n = parseAmountAr(s);
      if (n != null) {
        if (max == null || n > max) max = n;
      }
    }
  }
  return max;
}

function normalizeAmount(n?: number | null): number | null {
  if (n == null || !isFinite(n)) return null;
  // Redondeo a 2 decimales
  return Math.round(n * 100) / 100;
}

// --- Razón Social ---
function findRazonSocial(lines: string[], labels: string[], role: 'emisor' | 'receptor'): string | undefined {
  // Estrategia:
  // 1) Buscar línea con etiqueta y tomar la siguiente línea con texto sustantivo
  // 2) Si no aparece, usar heurística de encabezado (findHeaderName)
  const lower = (s: string) => s.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const l = lower(L);
    if (labels.some((lab) => l.includes(lab))) {
      // candidato en la misma línea
      const same = pickNameFromString(L);
      if (same) return same;
      // o en siguientes 3 líneas
      for (let k = 1; k <= 3; k++) {
        const cand = lines[i + k];
        if (!cand) break;
        const name = pickNameFromString(cand);
        if (name) return name;
      }
    }
  }

  // Heurística adicional: bloques Cliente/Proveedor
  const block = findBlock(lines, role === 'receptor' ? ['cliente', 'receptor', 'señor', 'señores', 'senor', 'senores'] : ['proveedor', 'emisor']);
  if (block) {
    const name = block.find((x) => isLikelyBusinessName(x));
    if (name) return name;
  }

  return undefined;
}

function pickNameFromString(s: string): string | null {
  // Descarta campos evidentes que no son nombres
  if (!s) return null;
  const bad = /(cuit|iva|domicilio|condición|condicion|ingresos brutos|iibb|responsable|monotributo|punto de venta|tipo|comprobante|cae)/i;
  if (bad.test(s)) return null;

  // Quitar etiquetas comunes
  let t = s.replace(/^(razón social|razon social|denominación|denominacion|cliente|receptor|proveedor|emisor)[:\-\s]*/i, '').trim();

  // Preferir líneas con mayúsculas y/o "S.A", "S.R.L", etc.
  if (isLikelyBusinessName(t)) return t;
  return null;
}

function isLikelyBusinessName(s: string): boolean {
  if (!s) return false;
  const tokens = s.trim();
  const hasLegal = /(s\.?a\.?|s\.?r\.?l\.?|s\.?a\.?s\.?|s\.?c\.?a\.?|s\.?a\.?i\.?c\.?|\bsa\b|\bsrl\b|\bsas\b)/i.test(tokens);
  const manyCaps = /[A-ZÁÉÍÓÚÑ]{3,}/.test(tokens);
  return hasLegal || manyCaps;
}

function findHeaderName(lines: string[]): string | undefined {
  // Muchas facturas ponen la razón social del EMISOR en cabecera (primeras 10 líneas)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const cand = pickNameFromString(lines[i]) || lines[i];
    if (isLikelyBusinessName(cand)) return cand;
  }
  return undefined;
}

function findBlock(lines: string[], anchors: string[]): string[] | null {
  const lower = (s: string) => s.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    const l = lower(lines[i]);
    if (anchors.some((a) => l.includes(a))) {
      // devolver las próximas 6 líneas como posible bloque de datos
      return lines.slice(i, Math.min(i + 6, lines.length));
    }
  }
  return null;
}

// --- QR AFIP ---
function tryDecodeAfipQr(text: string): { fecha?: string; importe?: number } | null {
  if (!text) return null;
  const m = text.match(/https?:\/\/www\.afip\.gob\.ar\/fe\/qr\/\?p=([A-Za-z0-9_\-]+)/);
  if (!m) return null;
  try {
    const b64url = m[1];
    const jsonStr = Buffer.from(b64url.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const data = JSON.parse(jsonStr);
    const fecha = normalizeDate(data.fecha || null) || null;
    const importe = typeof data.importe === 'number' ? data.importe : parseAmountAr(String(data.importe || ''));
    return { fecha: fecha || undefined, importe: importe ?? undefined };
  } catch (e) {
    return null;
  }
}

// =============================================================
//                      Helpers varios
// =============================================================

function pickAfterLabel(line: string, ...labels: string[]): string | null {
  const l = line.toLowerCase();
  for (const lab of labels) {
    const idx = l.indexOf(lab.toLowerCase());
    if (idx >= 0) {
      const after = line.slice(idx + lab.length).replace(/^[\s:\-]+/, '');
      return after.trim() || null;
    }
  }
  return null;
}

// =============================================================
//               Función de compatibilidad con OCR existente
// =============================================================

export async function extractInvoiceDataFromText(text: string): Promise<{
  type_letter?: string;
  doc_code?: string;
  point_of_sale?: string;
  invoice_number?: string;
  comprobante_id?: string;
  issue_date?: string;
  service_period_from?: string;
  service_period_to?: string;
  due_date?: string;
  supplier?: {
    name?: string;
    legal_name?: string;
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
}> {
  // Usar el nuevo extractor
  const result = await extractInvoice({ textOverride: text, rolePreference: 'emisor' });
  
  // Mapear al formato esperado por el sistema existente
  return {
    issue_date: result.fecha_emision || undefined,
    due_date: result.fecha_vencimiento || undefined,
    supplier: {
      name: result.razon_social || undefined,
      legal_name: result.razon_social || undefined,
    },
    amounts: {
      total: result.monto_total || undefined,
      currency_code: 'ARS',
      net: result.monto_total ? Math.round((result.monto_total / 1.21) * 100) / 100 : undefined,
      taxes: result.monto_total ? [{
        type: 'IVA',
        rate: 0.21,
        amount: result.monto_total ? result.monto_total - Math.round((result.monto_total / 1.21) * 100) / 100 : 0
      }] : []
    },
    ocr_confidence: 0.9,
    needs_review: !result.razon_social || !result.fecha_emision || !result.monto_total,
  };
}