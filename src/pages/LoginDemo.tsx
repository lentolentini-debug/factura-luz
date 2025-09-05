import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const LoginDemo = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('demo');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo login - redirect to dashboard
    if (username === 'admin' && password === 'demo') {
      toast({
        title: "¡Bienvenido!",
        description: "Sesión demo iniciada correctamente.",
      });
      // Simple redirect to dashboard for demo
      window.location.href = '#/dashboard';
    } else {
      toast({
        title: "Error",
        description: "Usuario: admin, Contraseña: demo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Caja Facturas</h1>
          <p className="text-muted-foreground">Sistema de Cobros</p>
        </div>

        {/* Demo Notice */}
        <div className="bg-secondary border border-border rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground">Modo Demo</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Para funcionalidad completa, conecta tu proyecto Supabase
              </p>
              <p className="text-xs text-muted-foreground">
                Usuario: <strong>admin</strong> | Contraseña: <strong>demo</strong>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-foreground">Usuario</Label>
            <Input 
              type="text" 
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-foreground">Contraseña</Label>
            <Input 
              type="password" 
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Iniciar Sesión Demo
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Haz clic en el botón verde "Supabase" arriba para conectar tu base de datos
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};