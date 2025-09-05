import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Login } from '@/pages/Login';
import Index from '@/pages/Index';
import { Facturas } from '@/pages/Facturas';
import { Pagos } from '@/pages/Pagos';
import { Proveedores } from '@/pages/Proveedores';
import { CargarFactura } from '@/pages/CargarFactura';
import { Chat } from '@/pages/Chat';
import { Configuracion } from '@/pages/Configuracion';
import { Backups } from '@/pages/Backups';
import NotFound from '@/pages/NotFound';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/facturas" element={<Facturas />} />
        <Route path="/pagos" element={<Pagos />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/cargar" element={<CargarFactura />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/backups" element={<Backups />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;