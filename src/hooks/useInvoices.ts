import { useState, useEffect } from 'react';
import { supabase, Invoice, Supplier } from '@/lib/supabase';
import { useAuth } from './useAuth';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (invoiceData: Partial<Invoice>) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        created_by: user.id,
        status: 'Recibida',
        currency: invoiceData.currency || 'ARS',
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'CREATE_INVOICE',
      entity_type: 'invoice',
      entity_id: data.id,
      payload_json: invoiceData,
    });

    await fetchInvoices();
    return data;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('invoices')
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
      action: 'UPDATE_INVOICE',
      entity_type: 'invoice',
      entity_id: id,
      payload_json: updates,
    });

    await fetchInvoices();
    return data;
  };

  const deleteInvoice = async (id: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'DELETE_INVOICE',
      entity_type: 'invoice',
      entity_id: id,
      payload_json: { deleted: true },
    });

    await fetchInvoices();
  };

  const updateOverdueInvoices = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'Vencida' })
      .in('status', ['Recibida', 'Pendiente'])
      .lt('due_date', today);

    if (error) throw error;
    await fetchInvoices();
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  return {
    invoices,
    loading,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updateOverdueInvoices,
  };
};