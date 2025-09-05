import { useState, useEffect, createContext, useContext } from 'react';

interface DemoUser {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: DemoUser | null;
  profile: DemoUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signInWithUsername: (username: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing demo session
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
      setUser(JSON.parse(demoUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    if (username === 'admin' && password === 'demo') {
      const demoUser = {
        id: '1',
        username: 'admin',
        role: 'admin'
      };
      setUser(demoUser);
      localStorage.setItem('demoUser', JSON.stringify(demoUser));
    } else {
      throw new Error('Credenciales incorrectas');
    }
  };

  const signInWithUsername = async (username: string, password: string) => {
    return signIn(username, password);
  };

  const signUp = async (email: string, password: string, username: string) => {
    throw new Error('Registro no disponible en modo demo');
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('demoUser');
  };

  const resetPassword = async (email: string) => {
    throw new Error('Recuperación de contraseña no disponible en modo demo');
  };

  return {
    user,
    profile: user,
    loading,
    signIn,
    signInWithUsername,
    signUp,
    signOut,
    resetPassword,
  };
};

export { AuthContext };