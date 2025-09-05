import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Upload, 
  MessageSquare, 
  Users, 
  Settings,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Facturas', href: '/facturas', icon: FileText },
  { name: 'Pagos', href: '/pagos', icon: CreditCard },
  { name: 'Cargar Factura', href: '/cargar', icon: Upload },
  { name: 'Conversación', href: '/chat', icon: MessageSquare },
  { name: 'Proveedores', href: '/proveedores', icon: Users },
  { name: 'Backups', href: '/backups', icon: Database },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-card">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Caja Facturas</h1>
            <p className="text-sm text-muted-foreground">Sistema de Cobros</p>
          </div>
        </div>

        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-elegant" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};