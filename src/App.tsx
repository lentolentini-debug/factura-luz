import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Dashboard } from "./pages/Dashboard";
import { Facturas } from "./pages/Facturas";
import { Proveedores } from "./pages/Proveedores";
import { CargarFactura } from "./pages/CargarFactura";
import { Pagos } from "./pages/Pagos";
import { Configuracion } from "./pages/Configuracion";
import { Backups } from "./pages/Backups";
import { Login } from "./pages/Login";
import { Chat } from "./pages/Chat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Simple debugging component
const DebugAuth = () => {
  const { user, loading, session } = useAuth();
  
  console.log('🐛 Debug Auth State:', { 
    user: user?.id, 
    loading, 
    hasSession: !!session 
  });

  if (loading) {
    console.log('⏳ App is loading...');
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg">Cargando aplicación...</p>
        <p className="text-sm text-slate-400 mt-2">Conectando con Supabase...</p>
      </div>
    );
  }
  
  if (!user) {
    console.log('👤 No user logged in, showing login page');
    return <Login />;
  }
  
  console.log('✅ User logged in, showing dashboard');
  return <Dashboard />;
};

const App = () => {
  console.log('🚀 App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/*" element={<DebugAuth />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;