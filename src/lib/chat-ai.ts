// Servicio de IA para procesar mensajes del chat
interface AIResponse {
  type: string;
  payload?: any;
  message?: string;
  suggestions?: string[];
}

export class ChatAIService {
  static async processMessage(message: string, context: {
    invoices: any[];
    suppliers: any[];
    payments: any[];
  }): Promise<AIResponse> {
    // Simulación de procesamiento con IA
    // En producción, aquí se usaría OpenAI, Claude, etc.
    
    const lowercaseMessage = message.toLowerCase();
    
    // Detectar intenciones comunes
    if (this.isStatusQuery(lowercaseMessage)) {
      return this.handleStatusQuery(message, context);
    }
    
    if (this.isListQuery(lowercaseMessage)) {
      return this.handleListQuery(message, context);
    }
    
    if (this.isStatsQuery(lowercaseMessage)) {
      return this.handleStatsQuery(message, context);
    }
    
    if (this.isUpcomingQuery(lowercaseMessage)) {
      return this.handleUpcomingQuery(message, context);
    }
    
    if (this.isCreateQuery(lowercaseMessage)) {
      return this.handleCreateQuery(message, context);
    }
    
    // Respuesta por defecto
    return {
      type: 'GENERAL_RESPONSE',
      message: 'Puedo ayudarte con:\n\n• Ver el estado de facturas\n• Listar facturas por filtros\n• Mostrar estadísticas\n• Ver facturas próximas a vencer\n• Crear nuevas facturas\n• Registrar pagos\n\n¿Qué necesitas hacer?',
      suggestions: [
        '¿Cuántas facturas tengo pendientes?',
        'Muéstrame facturas de este mes',
        'Facturas que vencen esta semana',
        'Estadísticas del sistema'
      ]
    };
  }

  private static isStatusQuery(message: string): boolean {
    const patterns = [
      /estado.*factura/i,
      /factura.*estado/i,
      /cómo.*está.*factura/i,
      /qué.*pasó.*con.*factura/i,
      /factura.*\d+/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private static isListQuery(message: string): boolean {
    const patterns = [
      /mostrar.*facturas?/i,
      /listar.*facturas?/i,
      /ver.*facturas?/i,
      /facturas?.*pendientes?/i,
      /facturas?.*pagadas?/i,
      /facturas?.*vencidas?/i,
      /facturas?.*de.*mes/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private static isStatsQuery(message: string): boolean {
    const patterns = [
      /estadísticas?/i,
      /resumen/i,
      /cuántas?.*facturas?/i,
      /total.*pendiente/i,
      /total.*vencido/i,
      /dashboard/i,
      /números/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private static isUpcomingQuery(message: string): boolean {
    const patterns = [
      /próximas?.*vencer/i,
      /vencen.*pronto/i,
      /facturas?.*esta.*semana/i,
      /facturas?.*próximos?.*días?/i,
      /recordatorios?/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private static isCreateQuery(message: string): boolean {
    const patterns = [
      /crear.*factura/i,
      /nueva.*factura/i,
      /agregar.*factura/i,
      /cargar.*factura/i,
      /registrar.*pago/i,
      /nuevo.*pago/i
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private static handleStatusQuery(message: string, context: any) {
    // Extraer número de factura si existe
    const invoiceNumberMatch = message.match(/FC[_-]?\d+|\d{5,}/i);
    const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[0] : null;

    // Extraer nombre de proveedor si existe
    const supplierMatch = message.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    const supplierName = supplierMatch ? supplierMatch.find(name => 
      context.suppliers.some((s: any) => s.name.toLowerCase().includes(name.toLowerCase()))
    ) : null;

    return {
      type: 'GET_INVOICE_STATUS',
      payload: {
        invoice_number: invoiceNumber,
        supplier_name: supplierName
      }
    };
  }

  private static handleListQuery(message: string, context: any) {
    let status = null;
    
    if (/pendientes?/i.test(message)) status = 'Pendiente';
    if (/recibidas?/i.test(message)) status = 'Recibida';
    if (/pagadas?/i.test(message)) status = 'Pagada';
    if (/vencidas?/i.test(message)) status = 'Vencida';

    // Detectar rango de fechas
    let dateRange = null;
    if (/este.*mes/i.test(message)) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateRange = {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0]
      };
    }

    return {
      type: 'LIST_INVOICES',
      payload: {
        status,
        date_range: dateRange
      }
    };
  }

  private static handleStatsQuery(message: string, context: any) {
    return {
      type: 'GET_STATS',
      payload: {}
    };
  }

  private static handleUpcomingQuery(message: string, context: any) {
    let daysAhead = 7; // Por defecto una semana

    if (/esta.*semana/i.test(message)) daysAhead = 7;
    if (/próximos?.*3.*días?/i.test(message)) daysAhead = 3;
    if (/próximos?.*5.*días?/i.test(message)) daysAhead = 5;
    if (/próximos?.*10.*días?/i.test(message)) daysAhead = 10;

    return {
      type: 'GET_UPCOMING_DUE',
      payload: {
        days_ahead: daysAhead
      }
    };
  }

  private static handleCreateQuery(message: string, context: any) {
    if (/registrar.*pago|nuevo.*pago/i.test(message)) {
      return {
        type: 'NAVIGATE',
        payload: {
          route: '/pagos',
          action: 'create'
        }
      };
    }

    return {
      type: 'NAVIGATE',
      payload: {
        route: '/cargar',
        action: 'create'
      }
    };
  }
}