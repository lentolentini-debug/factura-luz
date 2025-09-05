import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Calendar, Settings, Mail, Clock, Database } from 'lucide-react';
import { toast } from 'sonner';

export const Configuracion = () => {
  const handleExportData = async (format: 'csv' | 'json') => {
    try {
      toast.info(`Exportando datos en formato ${format.toUpperCase()}...`);
      
      // Simulación de exportación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Datos exportados exitosamente en ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Error al exportar los datos');
    }
  };

  const handleBackupNow = async () => {
    try {
      toast.info('Iniciando backup manual...');
      
      // Simulación de backup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('Backup completado exitosamente');
    } catch (error) {
      toast.error('Error al realizar el backup');
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona las configuraciones del sistema y exportaciones
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración General */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Configuración General</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Moneda Base</Label>
                <Select defaultValue="ARS">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zona Horaria</Label>
                <Select defaultValue="america/argentina/buenos_aires">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america/argentina/buenos_aires">
                      Argentina/Buenos Aires
                    </SelectItem>
                    <SelectItem value="america/sao_paulo">Brasil/São Paulo</SelectItem>
                    <SelectItem value="america/santiago">Chile/Santiago</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Días de Recordatorio</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" defaultValue="3" placeholder="Primer aviso" />
                  <Input type="number" defaultValue="1" placeholder="Segundo aviso" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Días antes del vencimiento para enviar recordatorios
                </p>
              </div>

              <Button className="w-full">
                Guardar Configuración
              </Button>
            </div>
          </Card>

          {/* Notificaciones */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Notificaciones</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email para Notificaciones</Label>
                <Input 
                  type="email" 
                  placeholder="admin@empresa.com"
                  defaultValue="admin@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Horario de Envío</Label>
                <Select defaultValue="08:00">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="07:00">07:00</SelectItem>
                    <SelectItem value="08:00">08:00</SelectItem>
                    <SelectItem value="09:00">09:00</SelectItem>
                    <SelectItem value="10:00">10:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Tipos de Notificaciones</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Facturas próximas a vencer</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Facturas vencidas</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Resumen semanal</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Nuevas facturas creadas</span>
                  </label>
                </div>
              </div>

              <Button className="w-full">
                Guardar Notificaciones
              </Button>
            </div>
          </Card>

          {/* Exportaciones */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Download className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Exportaciones</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Exporta los datos del sistema en diferentes formatos
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportData('csv')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExportData('json')}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Exportación Automática</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Configuración de backups automáticos semanales
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estado:</span>
                    <Badge variant="default">Activo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Frecuencia:</span>
                    <span className="text-sm text-muted-foreground">Semanal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Próximo backup:</span>
                    <span className="text-sm text-muted-foreground">Domingo 02:00</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Backups */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Backups</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Gestiona los backups del sistema
                </p>

                <Button 
                  onClick={handleBackupNow}
                  className="w-full mb-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Realizar Backup Ahora
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Backups Recientes</h4>
                <div className="space-y-2">
                  {[
                    { date: '2024-03-10', size: '2.5 MB', status: 'Completado' },
                    { date: '2024-03-03', size: '2.3 MB', status: 'Completado' },
                    { date: '2024-02-25', size: '2.1 MB', status: 'Completado' },
                  ].map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                      <div>
                        <p className="text-sm font-medium">{backup.date}</p>
                        <p className="text-xs text-muted-foreground">{backup.size}</p>
                      </div>
                      <Badge variant="outline">{backup.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Los backups se almacenan por 30 días
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* API Configuration */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Configuración de APIs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Google Cloud Vision API Key</Label>
                <Input 
                  type="password" 
                  placeholder="Tu API key para OCR..."
                />
                <p className="text-xs text-muted-foreground">
                  Para funcionalidad de OCR mejorada en carga de facturas
                </p>
              </div>

              <div className="space-y-2">
                <Label>SendGrid API Key</Label>
                <Input 
                  type="password" 
                  placeholder="Tu API key para emails..."
                />
                <p className="text-xs text-muted-foreground">
                  Para envío de notificaciones por email
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>AWS S3 Bucket</Label>
                <Input placeholder="nombre-del-bucket" />
                <p className="text-xs text-muted-foreground">
                  Para almacenamiento de backups en la nube
                </p>
              </div>

              <div className="space-y-2">
                <Label>AWS Access Key</Label>
                <Input type="password" placeholder="AKIA..." />
              </div>

              <div className="space-y-2">
                <Label>AWS Secret Key</Label>
                <Input type="password" placeholder="Secret key..." />
              </div>
            </div>
          </div>

          <Button className="w-full mt-6">
            Guardar Configuración de APIs
          </Button>
        </Card>
      </div>
    </Layout>
  );
};