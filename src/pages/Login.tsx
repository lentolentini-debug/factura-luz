import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const Login = () => {
  console.log('🔐 Login component rendering...');
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithUsername, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Attempting login/signup...');
    setLoading(true);

    try {
      let result;
      if (isLoginMode) {
        console.log('🔐 Login mode');
        if (username.includes('@')) {
          result = await signIn(username, password);
        } else {
          result = await signInWithUsername(username, password);
        }
        
        if (result.error) {
          throw new Error(result.error.message || 'Error al iniciar sesión');
        }
        
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });
      } else {
        console.log('🔐 Signup mode');
        result = await signUp(email, password, username);
        
        if (result.error) {
          throw new Error(result.error.message || 'Error al crear la cuenta');
        }
        
        toast({
          title: "Cuenta creada",
          description: "Revisa tu email para confirmar tu cuenta.",
        });
        setIsLoginMode(true);
      }
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email && !username.includes('@')) {
      toast({
        title: "Email requerido",
        description: "Ingresa tu email para recuperar la contraseña.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await resetPassword(username.includes('@') ? username : email);
      
      if (result.error) {
        throw new Error(result.error.message || 'Error al enviar el email');
      }
      
      toast({
        title: "Email enviado",
        description: "Revisa tu email para recuperar tu contraseña.",
      });
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Facturas</h1>
          <p className="text-gray-600">Gestión de Cobros y Pagos</p>
          <p className="text-xs text-green-600 mt-2">✅ Conectado a Supabase</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLoginMode ? (
            <div>
              <Label className="text-sm font-medium text-gray-700">Usuario o Email</Label>
              <Input 
                type="text" 
                placeholder="Ingresa tu usuario o email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          ) : (
            <>
              <div>
                <Label className="text-sm font-medium text-gray-700">Usuario</Label>
                <Input 
                  type="text" 
                  placeholder="Elige un nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input 
                  type="email" 
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </>
          )}
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Contraseña</Label>
            <Input 
              type="password" 
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            size="lg" 
            disabled={loading}
          >
            {loading ? 'Cargando...' : (isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </Button>

          <div className="text-center space-y-2">
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div>
              <button 
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {isLoginMode ? '¿No tienes cuenta? Créala aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p><strong>Credenciales de prueba:</strong></p>
          <p>Email: admin@test.com</p>
          <p>Contraseña: password123</p>
        </div>
      </Card>
    </div>
  );
};