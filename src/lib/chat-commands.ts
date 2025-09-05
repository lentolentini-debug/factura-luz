// Servicio de comandos para el chat
export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export class ChatCommandService {
  static async executeCommand(command: any, context: {
    supabase: any;
    userId: string;
    invoicesHook: any;
    suppliersHook: any;
    paymentsHook: any;
  }): Promise<CommandResult> {
    const { supabase, userId, invoicesHook, suppliersHook, paymentsHook } = context;

    try {
      switch (command.type) {
        case 'GET_INVOICE_STATUS':
          return await this.getInvoiceStatus(command.payload, invoicesHook);
          
        case 'LIST_INVOICES':
          return await this.listInvoices(command.payload, invoicesHook);
          
        case 'GET_STATS':
          return await this.getStats(command.payload, invoicesHook);
          
        case 'GET_UPCOMING_DUE':
          return await this.getUpcomingDue(command.payload, invoicesHook);
          
        case 'FIND_SUPPLIERS':
          return await this.findSuppliers(command.payload, suppliersHook);
          
        case 'CREATE_INVOICE':
          return await this.createInvoice(command.payload, invoicesHook, suppliersHook);
          
        case 'REGISTER_PAYMENT':
          return await this.registerPayment(command.payload, paymentsHook);
          
        default:
          return {
            success: false,
            message: 'Comando no reconocido'
          };
      }
    } catch (error) {
      console.error('Error executing command:', error);
      return {
        success: false,
        message: 'Error al ejecutar el comando'
      };
    }
  }

  private static async getInvoiceStatus(payload: any, invoicesHook: any): Promise<CommandResult> {
    const { invoice_number, supplier_name } = payload;
    
    let invoices = invoicesHook.invoices || [];
    
    if (invoice_number) {
      invoices = invoices.filter((inv: any) => 
        inv.invoice_number.toLowerCase().includes(invoice_number.toLowerCase())
      );
    }
    
    if (supplier_name) {
      invoices = invoices.filter((inv: any) => 
        inv.supplier?.name.toLowerCase().includes(supplier_name.toLowerCase())
      );
    }

    if (invoices.length === 0) {
      return {
        success: false,
        message: 'No se encontraron facturas con esos criterios'
      };
    }

    return {
      success: true,
      message: `Encontré ${invoices.length} factura${invoices.length > 1 ? 's' : ''}`,
      data: invoices.slice(0, 5) // Limitar a 5 resultados
    };
  }

  private static async listInvoices(payload: any, invoicesHook: any): Promise<CommandResult> {
    const { status, supplier_name, date_range } = payload;
    
    let invoices = invoicesHook.invoices || [];
    
    if (status) {
      invoices = invoices.filter((inv: any) => inv.status === status);
    }
    
    if (supplier_name) {
      invoices = invoices.filter((inv: any) => 
        inv.supplier?.name.toLowerCase().includes(supplier_name.toLowerCase())
      );
    }
    
    if (date_range) {
      const start = new Date(date_range.start);
      const end = new Date(date_range.end);
      invoices = invoices.filter((inv: any) => {
        const dueDate = new Date(inv.due_date);
        return dueDate >= start && dueDate <= end;
      });
    }

    return {
      success: true,
      message: `Encontré ${invoices.length} facturas`,
      data: invoices.slice(0, 10)
    };
  }

  private static async getStats(payload: any, invoicesHook: any): Promise<CommandResult> {
    const invoices = invoicesHook.invoices || [];
    
    const stats = {
      total_invoices: invoices.length,
      total_pending: invoices.filter((inv: any) => ['Recibida', 'Pendiente'].includes(inv.status)).length,
      total_overdue: invoices.filter((inv: any) => inv.status === 'Vencida').length,
      total_paid: invoices.filter((inv: any) => inv.status === 'Pagada').length,
      total_amount_pending: invoices
        .filter((inv: any) => ['Recibida', 'Pendiente'].includes(inv.status))
        .reduce((sum: number, inv: any) => sum + inv.amount_total, 0),
      total_amount_overdue: invoices
        .filter((inv: any) => inv.status === 'Vencida')
        .reduce((sum: number, inv: any) => sum + inv.amount_total, 0),
    };

    return {
      success: true,
      message: 'Estadísticas actualizadas',
      data: stats
    };
  }

  private static async getUpcomingDue(payload: any, invoicesHook: any): Promise<CommandResult> {
    const { days_ahead = 7 } = payload;
    const invoices = invoicesHook.invoices || [];
    
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days_ahead);
    
    const upcoming = invoices.filter((inv: any) => {
      const dueDate = new Date(inv.due_date);
      return ['Recibida', 'Pendiente'].includes(inv.status) && 
             dueDate >= now && 
             dueDate <= futureDate;
    }).sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    return {
      success: true,
      message: `${upcoming.length} facturas vencen en los próximos ${days_ahead} días`,
      data: upcoming
    };
  }

  private static async findSuppliers(payload: any, suppliersHook: any): Promise<CommandResult> {
    const { name } = payload;
    const suppliers = suppliersHook.suppliers || [];
    
    const filtered = suppliers.filter((supplier: any) =>
      supplier.name.toLowerCase().includes(name.toLowerCase())
    );

    return {
      success: true,
      message: `Encontré ${filtered.length} proveedor${filtered.length !== 1 ? 'es' : ''}`,
      data: filtered
    };
  }

  private static async createInvoice(payload: any, invoicesHook: any, suppliersHook: any): Promise<CommandResult> {
    try {
      const supplier = await suppliersHook.findOrCreateSupplier(
        payload.supplier.name,
        payload.supplier.tax_id
      );

      const invoiceData = {
        supplier_id: supplier.id,
        ...payload.invoice
      };

      await invoicesHook.createInvoice(invoiceData);

      return {
        success: true,
        message: `Factura ${payload.invoice.invoice_number} creada exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al crear la factura'
      };
    }
  }

  private static async registerPayment(payload: any, paymentsHook: any): Promise<CommandResult> {
    try {
      // Buscar factura por criterios
      const invoices = await paymentsHook.findInvoiceForPayment(payload.invoice_lookup);
      
      if (invoices.length === 0) {
        return {
          success: false,
          message: 'No se encontró la factura especificada'
        };
      }

      const invoice = invoices[0]; // Tomar la primera coincidencia

      const paymentData = {
        invoice_id: invoice.id,
        ...payload.payment
      };

      await paymentsHook.createPayment(paymentData);

      return {
        success: true,
        message: `Pago registrado para factura ${invoice.invoice_number}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al registrar el pago'
      };
    }
  }
}