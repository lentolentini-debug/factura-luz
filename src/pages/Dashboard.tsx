import { Layout } from '@/components/Layout';
import { KPICard } from '@/components/KPICard';
import { InvoiceTable } from '@/components/InvoiceTable';
import { Card } from '@/components/ui/card';
import { 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

// Datos de ejemplo para KPIs
const kpiData = {
  totalPendiente: 1250000,
  totalVencido: 385000,
  totalPagado: 2100000,
  facturasPendientes: 12,
};

const upcomingInvoices = [
  { id: '1', supplier: 'Proveedor ABC S.A.', amount: 125000, dueDate: '2024-03-15' },
  { id: '2', supplier: 'Servicios XYZ Ltda.', amount: 87500, dueDate: '2024-03-18' },
  { id: '3', supplier: 'Materiales DEF S.R.L.', amount: 195000, dueDate: '2024-03-20' },
];

export const Dashboard = () => {
  return (
    <Layout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de facturas y cobros del sistema
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Pendiente"
            value={formatCurrency(kpiData.totalPendiente)}
            change="+12% vs mes anterior"
            changeType="neutral"
            icon={DollarSign}
            variant="default"
          />
          <KPICard
            title="Total Vencido"
            value={formatCurrency(kpiData.totalVencido)}
            change="3 facturas vencidas"
            changeType="negative"
            icon={AlertTriangle}
            variant="destructive"
          />
          <KPICard
            title="Total Pagado (Mes)"
            value={formatCurrency(kpiData.totalPagado)}
            change="+8% vs mes anterior"
            changeType="positive"
            icon={CheckCircle}
            variant="success"
          />
          <KPICard
            title="Facturas Pendientes"
            value={kpiData.facturasPendientes.toString()}
            change="2 próximas a vencer"
            changeType="neutral"
            icon={FileText}
            variant="warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Facturas por vencer */}
          <Card className="shadow-card lg:col-span-1">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Próximas a Vencer</h3>
              </div>
              <div className="space-y-3">
                {upcomingInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">{invoice.supplier}</p>
                      <p className="text-xs text-muted-foreground">Vence: {invoice.dueDate}</p>
                    </div>
                    <p className="font-semibold text-sm text-foreground">
                      {formatCurrency(invoice.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Gráfico placeholder */}
          <Card className="shadow-card lg:col-span-2">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Pagos por Mes</h3>
              </div>
              <div className="h-64 bg-gradient-to-br from-primary-light to-accent rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  Gráfico de pagos por mes<br />
                  <span className="text-sm">(Se implementará con Recharts)</span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabla de facturas */}
        <InvoiceTable />
      </div>
    </Layout>
  );
};