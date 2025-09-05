import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, FileText, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  invoiceCard?: {
    number: string;
    supplier: string;
    amount: number;
    status: string;
  };
}

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'assistant',
    content: '¡Hola! Soy tu asistente de facturas. Puedo ayudarte a consultar el estado de facturas, registrar pagos, ver estadísticas y más. ¿En qué puedo ayudarte hoy?',
    timestamp: new Date(),
  }
];

const quickActions = [
  'Ver facturas pendientes',
  'Estadísticas del mes',
  'Facturas próximas a vencer',
  'Registrar nuevo pago'
];

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simular respuesta del asistente
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Entiendo tu consulta. Aquí tienes la información solicitada:',
        timestamp: new Date(),
        invoiceCard: input.toLowerCase().includes('pendiente') ? {
          number: 'FAC-001-2024',
          supplier: 'Proveedor ABC S.A.',
          amount: 125000,
          status: 'Pendiente'
        } : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <div className="h-screen flex flex-col p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Conversación</h1>
          <p className="text-muted-foreground">
            Consulta y gestiona tus facturas de forma conversacional
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat principal */}
          <Card className="shadow-card lg:col-span-3 flex flex-col">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Asistente Virtual</h3>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.type === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-foreground'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    <div className={`flex-1 max-w-[80%] ${
                      message.type === 'user' ? 'text-right' : ''
                    }`}>
                      <div className={`p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-secondary text-foreground'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>

                      {/* Tarjeta de factura si existe */}
                      {message.invoiceCard && (
                        <Card className="mt-3 p-4 max-w-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              <span className="font-medium text-sm">{message.invoiceCard.number}</span>
                            </div>
                            <Badge variant="outline">{message.invoiceCard.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{message.invoiceCard.supplier}</p>
                          <p className="font-semibold text-foreground">{formatCurrency(message.invoiceCard.amount)}</p>
                        </Card>
                      )}

                      <p className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString('es-AR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input de mensaje */}
            <div className="p-6 border-t border-border">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu consulta aquí..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-primary hover:shadow-elegant transition-all duration-300"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Acciones rápidas */}
          <Card className="shadow-card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleQuickAction(action)}
                  >
                    {action.includes('pago') ? (
                      <CreditCard className="w-4 h-4 mr-2" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    <span className="text-sm">{action}</span>
                  </Button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-accent rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> Puedes preguntar por facturas específicas, 
                  ver estadísticas o registrar pagos de forma natural.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};