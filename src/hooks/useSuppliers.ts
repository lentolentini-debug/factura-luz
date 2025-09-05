import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

type Supplier = Tables<'suppliers'>;

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSuppliers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        ...supplierData,
        created_by: user.id,
        default_currency: supplierData.default_currency || 'ARS',
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'CREATE_SUPPLIER',
      entity_type: 'supplier',
      entity_id: data.id,
      payload_json: supplierData,
    });

    await fetchSuppliers();
    return data;
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('suppliers')
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
      action: 'UPDATE_SUPPLIER',
      entity_type: 'supplier',
      entity_id: id,
      payload_json: updates,
    });

    await fetchSuppliers();
    return data;
  };

  const deleteSupplier = async (id: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'DELETE_SUPPLIER',
      entity_type: 'supplier',
      entity_id: id,
      payload_json: { deleted: true },
    });

    await fetchSuppliers();
  };

  const findOrCreateSupplier = async (name: string, taxId?: string) => {
    // Try to find existing supplier
    let query = supabase.from('suppliers').select('*');
    
    if (taxId) {
      query = query.or(`name.ilike.%${name}%,tax_id.eq.${taxId}`);
    } else {
      query = query.ilike('name', `%${name}%`);
    }

    const { data: existing } = await query.limit(1).single();

    if (existing) {
      return existing;
    }

    // Create new supplier
    return await createSupplier({
      name,
      tax_id: taxId || null,
      cuit: taxId || null,
      email: null,
      phone: null,
      address: null,
      notes: null,
      default_currency: 'ARS',
    });
  };

  useEffect(() => {
    fetchSuppliers();
  }, [user]);

  return {
    suppliers,
    loading,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    findOrCreateSupplier,
  };
};