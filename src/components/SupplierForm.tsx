import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { toast } from 'sonner';

interface SupplierFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplierForm = ({ onClose, onSuccess }: SupplierFormProps) => {
  const { createSupplier } = useSuppliers();
  
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    default_currency: 'ARS',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }

    setLoading(true);

    try {
      await createSupplier({
        name: formData.name,
        tax_id: formData.tax_id || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        default_currency: formData.default_currency,
        notes: formData.notes || undefined,
      });
      
      toast.success('Proveedor creado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error('Error al crear el proveedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Nuevo Proveedor</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nombre del Proveedor *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Proveedor ABC S.A."
              required
            />
          </div>

          {/* CUIT/CUIL */}
          <div className="space-y-2">
            <Label htmlFor="tax_id">CUIT/CUIL</Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
              placeholder="20-12345678-9"
            />
          </div>

          {/* Moneda por defecto */}
          <div className="space-y-2">
            <Label>Moneda por Defecto</Label>
            <Select 
              value={formData.default_currency} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, default_currency: value }))}
            >
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="facturacion@proveedor.com"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+54 11 4444-5555"
            />
          </div>

          {/* Dirección */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Av. Corrientes 1234, CABA"
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
            placeholder="Notas adicionales sobre el proveedor..."
            rows={3}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Proveedor'}
          </Button>
        </div>
      </form>
    </Card>
  );
};