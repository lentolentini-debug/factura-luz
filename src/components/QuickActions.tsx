import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Plus, 
  MessageSquare, 
  CreditCard,
  FileText,
  Users
} from 'lucide-react';

const quickActions = [
  {
    title: 'Cargar Factura',
    description: 'Sube una nueva factura con OCR',
    icon: Upload,
    href: '/cargar',
    variant: 'default' as const
  },
  {
    title: 'Nueva Factura',
    description: 'Crear factura manualmente',
    icon: Plus,
    href: '/facturas',
    variant: 'outline' as const
  },
  {
    title: 'Registrar Pago',
    description: 'Marcar factura como pagada',
    icon: CreditCard,
    href: '/pagos',
    variant: 'outline' as const
  },
  {
    title: 'Conversación',
    description: 'Consulta con el asistente AI',
    icon: MessageSquare,
    href: '/chat',
    variant: 'outline' as const
  }
];

export const QuickActions = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Acciones Rápidas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} to={action.href}>
              <Button 
                variant={action.variant} 
                className="w-full h-auto p-4 flex flex-col items-center gap-3 hover:scale-105 transition-transform"
              >
                <Icon className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            </Link>
          );
        })}
      </div>
    </Card>
  );
};