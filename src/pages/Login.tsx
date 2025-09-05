import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithUsername, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLoginMode) {
        // Try login with username first, fallback to email
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
        navigate('/');
      } else {
        result = await signUp(email, password, username);
        
        if (result.error) {
          throw new Error(result.error.message || 'Error al crear la cuenta');
        }
        
        toast({
          title: "Cuenta creada",
          description: "Revisa tu email para confirmar tu cuenta.",
        });
        setIsLoginMode(true); // Switch to login mode after successful signup
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
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
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error",
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLoginMode ? (
            <div>
              <Label className="text-sm font-medium text-foreground">Usuario o Email</Label>
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
                <Label className="text-sm font-medium text-foreground">Usuario</Label>
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
                <Label className="text-sm font-medium text-foreground">Email</Label>
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

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Cargando...' : (isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </Button>

          <div className="text-center space-y-2">
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div>
              <button 
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isLoginMode ? '¿No tienes cuenta? Créala aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};