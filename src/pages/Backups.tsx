import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  Database, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

interface BackupRecord {
  id: string;
  name: string;
  size: string;
  created_at: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'in_progress' | 'failed';
  tables: string[];
}

const sampleBackups: BackupRecord[] = [
  {
    id: '1',
    name: 'Backup_2024_01_15_Manual',
    size: '2.4 MB',
    created_at: '2024-01-15T10:30:00Z',
    type: 'manual',
    status: 'completed',
    tables: ['invoices', 'suppliers', 'payments', 'profiles']
  },
  {
    id: '2',
    name: 'Backup_2024_01_14_Auto',
    size: '2.1 MB',
    created_at: '2024-01-14T02:00:00Z',
    type: 'automatic',
    status: 'completed',
    tables: ['invoices', 'suppliers', 'payments', 'profiles']
  },
  {
    id: '3',
    name: 'Backup_2024_01_13_Auto',
    size: '1.9 MB',
    created_at: '2024-01-13T02:00:00Z',
    type: 'automatic',
    status: 'completed',
    tables: ['invoices', 'suppliers', 'payments', 'profiles']
  }
];

const statusConfig = {
  completed: { 
    icon: CheckCircle, 
    label: 'Completado', 
    variant: 'default' as const,
    color: 'text-success'
  },
  in_progress: { 
    icon: RefreshCw, 
    label: 'En Progreso', 
    variant: 'secondary' as const,
    color: 'text-warning'
  },
  failed: { 
    icon: AlertCircle, 
    label: 'Fallido', 
    variant: 'destructive' as const,
    color: 'text-destructive'
  }
};

export const Backups = () => {
  const [backups] = useState<BackupRecord[]>(sampleBackups);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Backup creado",
        description: "El backup de la base de datos se ha creado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el backup. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (backup: BackupRecord) => {
    try {
      // Simulate download
      toast({
        title: "Descarga iniciada",
        description: `Descargando ${backup.name}...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el backup.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (backup: BackupRecord) => {
    try {
      // Simulate restore
      toast({
        title: "Restauración iniciada",
        description: `Restaurando desde ${backup.name}...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo restaurar el backup.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Backups</h1>
            <p className="text-muted-foreground">
              Gestiona los respaldos de tu base de datos
            </p>
          </div>
          <Button 
            onClick={handleCreateBackup} 
            disabled={isCreating}
            className="bg-gradient-primary"
          >
            {isCreating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isCreating ? 'Creando...' : 'Crear Backup'}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-bold text-foreground">{backups.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-success rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exitosos</p>
                <p className="text-2xl font-bold text-foreground">
                  {backups.filter(b => b.status === 'completed').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-warning rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último Backup</p>
                <p className="text-2xl font-bold text-foreground">
                  {backups.length > 0 ? 'Hoy' : 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Backup Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Configuración Automática</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">Backup Diario</h3>
                <p className="text-sm text-muted-foreground">
                  Se ejecuta automáticamente todos los días a las 2:00 AM
                </p>
              </div>
              <Badge variant="default">Activo</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <h3 className="font-medium text-foreground">Retención</h3>
                <p className="text-sm text-muted-foreground">
                  Se mantienen los últimos 30 backups automáticos
                </p>
              </div>
              <Badge variant="secondary">30 días</Badge>
            </div>
          </div>
        </Card>

        {/* Backup List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Historial de Backups</h2>
          <div className="space-y-4">
            {backups.map((backup) => {
              const StatusIcon = statusConfig[backup.status].icon;
              return (
                <div key={backup.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <StatusIcon className={`w-5 h-5 ${statusConfig[backup.status].color}`} />
                    <div>
                      <h3 className="font-medium text-foreground">{backup.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDateTime(backup.created_at)}</span>
                        <span>•</span>
                        <span>{backup.size}</span>
                        <span>•</span>
                        <Badge 
                          variant={backup.type === 'manual' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {backup.type === 'manual' ? 'Manual' : 'Automático'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Tablas:</span>
                        {backup.tables.map((table, index) => (
                          <Badge key={table} variant="outline" className="text-xs">
                            {table}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(backup)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(backup)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Restaurar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Import Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Importar Backup</h2>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Arrastra un archivo de backup aquí
            </h3>
            <p className="text-muted-foreground mb-4">
              O haz click para seleccionar un archivo (.sql, .json)
            </p>
            <Button variant="outline">
              Seleccionar Archivo
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};