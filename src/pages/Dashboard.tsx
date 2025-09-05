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
import { useInvoices } from '@/hooks/useInvoices';
import { useEffect, useMemo } from 'react';

export const Dashboard = () => {
  const { invoices, loading, updateOverdueInvoices } = useInvoices();

  useEffect(() => {
    // Actualizar facturas vencidas al cargar el dashboard
    updateOverdueInvoices();
  }, []);

  const kpiData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const totalPendiente = invoices
      .filter(inv => ['Recibida', 'Pendiente'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.amount_total, 0);
      
    const totalVencido = invoices
      .filter(inv => inv.status === 'Vencida')
      .reduce((sum, inv) => sum + inv.amount_total, 0);
      
    const totalPagado = invoices
      .filter(inv => {
        const invoiceDate = new Date(inv.created_at);
        return inv.status === 'Pagada' && 
               invoiceDate.getMonth() === currentMonth && 
               invoiceDate.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.amount_total, 0);
      
    const facturasPendientes = invoices
      .filter(inv => ['Recibida', 'Pendiente'].includes(inv.status)).length;

    return {
      totalPendiente,
      totalVencido,
      totalPagado,
      facturasPendientes,
    };
  }, [invoices]);

  const upcomingInvoices = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    return invoices
      .filter(inv => {
        const dueDate = new Date(inv.due_date);
        return ['Recibida', 'Pendiente'].includes(inv.status) && 
               dueDate >= now && 
               dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 3)
      .map(inv => ({
        id: inv.id,
        supplier: inv.supplier?.name || 'Sin proveedor',
        amount: inv.amount_total,
        dueDate: inv.due_date,
      }));
  }, [invoices]);
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