import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { useAuth } from '@/hooks/useAuthDemo';
import { Button } from './ui/button';
import { LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export const Layout = ({ children, showNavigation = true }: LayoutProps) => {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {showNavigation && <Navigation />}
      {showNavigation && (
        <header className="fixed top-0 left-64 right-0 h-16 bg-card border-b border-border shadow-sm z-40">
          <div className="h-full px-6 flex items-center justify-end gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{profile?.username}</span>
              <span className="text-xs bg-secondary px-2 py-1 rounded">
                {profile?.role}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </header>
      )}
      <main className={showNavigation ? "ml-64 pt-16" : ""}>
        {children}
      </main>
    </div>
  );
};