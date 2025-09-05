import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

type Payment = Tables<'payments'>;
type Invoice = Tables<'invoices'> & {
  supplier?: Tables<'suppliers'>;
};

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPayments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(
            *,
            supplier:suppliers(*)
          )
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Actualizar estado de la factura a "Pagada"
    await supabase
      .from('invoices')
      .update({ 
        status: 'Pagada',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentData.invoice_id);

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'CREATE_PAYMENT',
      entity_type: 'payment',
      entity_id: data.id,
      payload_json: paymentData,
    });

    await fetchPayments();
    return data;
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('payments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'UPDATE_PAYMENT',
      entity_type: 'payment',
      entity_id: id,
      payload_json: updates,
    });

    await fetchPayments();
    return data;
  };

  const deletePayment = async (id: string, invoiceId: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Revertir estado de la factura a "Pendiente"
    await supabase
      .from('invoices')
      .update({ 
        status: 'Pendiente',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'DELETE_PAYMENT',
      entity_type: 'payment',
      entity_id: id,
      payload_json: { deleted: true },
    });

    await fetchPayments();
  };

  const findInvoiceForPayment = async (criteria: {
    invoice_number?: string;
    supplier_name?: string;
    amount?: number;
    date_range?: { start: string; end: string };
  }): Promise<Invoice[]> => {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .in('status', ['Recibida', 'Pendiente']);

    if (criteria.invoice_number) {
      query = query.ilike('invoice_number', `%${criteria.invoice_number}%`);
    }

    if (criteria.supplier_name) {
      query = query.or(`supplier.name.ilike.%${criteria.supplier_name}%`);
    }

    if (criteria.amount) {
      const tolerance = criteria.amount * 0.01; // 1% tolerance
      query = query.gte('amount_total', criteria.amount - tolerance)
                   .lte('amount_total', criteria.amount + tolerance);
    }

    if (criteria.date_range) {
      query = query.gte('issue_date', criteria.date_range.start)
                   .lte('issue_date', criteria.date_range.end);
    }

    const { data, error } = await query.limit(10);
    
    if (error) throw error;
    return (data as Invoice[]) || [];
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  return {
    payments,
    loading,
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
    findInvoiceForPayment,
  };
};