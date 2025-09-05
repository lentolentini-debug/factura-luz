import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implementar autenticación con Supabase
    setTimeout(() => {
      setIsLoading(false);
      // Redirigir al dashboard
    }, 1000);
  };

  return (
    <Layout showNavigation={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-accent p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <div className="p-8 space-y-6">
            {/* Logo y título */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Caja Facturas</h1>
                <p className="text-muted-foreground">Sistema de Cobros y Facturación</p>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario o Email</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingrese su usuario o email"
                  required
                  className="transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingrese su contraseña"
                    required
                    className="pr-10 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-elegant transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            {/* Enlaces adicionales */}
            <div className="text-center space-y-2">
              <Link 
                to="/recuperar-password" 
                className="text-sm text-primary hover:text-primary-dark transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <div className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link 
                  to="/registro" 
                  className="text-primary hover:text-primary-dark transition-colors"
                >
                  Regístrate aquí
                </Link>
              </div>
            </div>

            {/* Nota sobre Supabase */}
            <div className="mt-6 p-4 bg-accent rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                La autenticación se implementará con Supabase Auth
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};