import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Función de login simple
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    console.log('🔐 Intentando login con:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('🔐 Resultado del login:', { data, error });
      
      if (error) {
        console.error('❌ Error de login:', error);
        alert('Error de login: ' + error.message);
      } else {
        console.log('✅ Login exitoso');
        setUser(data.user);
        alert('¡Login exitoso!');
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      alert('Error inesperado: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función de registro simple
  const handleSignup = async () => {
    if (!email || !password) {
      alert('Por favor ingresa email y contraseña');
      return;
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    console.log('🔐 Intentando crear cuenta con:', email);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      console.log('📧 Resultado del registro:', { data, error });
      
      if (error) {
        console.error('❌ Error de registro:', error);
        alert('Error al crear cuenta: ' + error.message);
      } else {
        console.log('✅ Cuenta creada exitosamente');
        alert('¡Cuenta creada! Revisa tu email para confirmar. Si no recibes el email, puedes intentar iniciar sesión directamente.');
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      alert('Error inesperado: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Si el usuario está logueado, mostrar dashboard simple
  if (user) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                📋 Caja Facturas
              </h1>
              <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cerrar Sesión
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  📄 Facturas
                </h3>
                <p className="text-blue-600">Gestionar facturas pendientes</p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  💰 Pagos
                </h3>
                <p className="text-green-600">Registrar pagos recibidos</p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  🏢 Proveedores
                </h3>
                <p className="text-purple-600">Administrar proveedores</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-green-600 font-medium">
                ✅ ¡Aplicación funcionando correctamente!
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Usuario: {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Página de login
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">📋</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Caja Facturas</h1>
          <p className="text-gray-600">Sistema de Gestión de Cobros</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleSignup}
            disabled={loading}
            className="text-blue-600 hover:underline text-sm"
          >
            ¿No tienes cuenta? Crear una nueva
          </button>
        </div>

        <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p><strong>Para probar:</strong></p>
          <p>Crea una cuenta nueva con tu email real</p>
        </div>
      </div>
    </div>
  );
};

export default App;