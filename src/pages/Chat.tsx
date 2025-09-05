import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Bot, User, FileText, DollarSign, Calendar, TrendingUp, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useInvoices } from '@/hooks/useInvoices';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePayments } from '@/hooks/usePayments';
import { ChatAIService } from '@/lib/chat-ai';
import { ChatCommandService } from '@/lib/chat-commands';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any;
  suggestions?: string[];
}

export const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const invoicesHook = useInvoices();
  const suppliersHook = useSuppliers();
  const paymentsHook = usePayments();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: '¡Hola! Soy tu asistente para el sistema de facturas. Puedo ayudarte a consultar información, crear facturas, registrar pagos y más. ¿En qué puedo ayudarte?',
      timestamp: new Date(),
      suggestions: [
        '¿Cuántas facturas tengo pendientes?',
        'Muéstrame facturas de este mes',
        'Facturas que vencen esta semana',
        'Estadísticas del sistema'
      ]
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Procesar mensaje con IA
      const aiResponse = await ChatAIService.processMessage(text, {
        invoices: invoicesHook.invoices,
        suppliers: suppliersHook.suppliers,
        payments: paymentsHook.payments
      });

      // Simular delay de IA
      await new Promise(resolve => setTimeout(resolve, 1000));

      let botResponse: Message;

      if (aiResponse.type === 'NAVIGATE') {
        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: `Te dirijo a la página correspondiente para ${aiResponse.payload?.action === 'create' ? 'crear' : 'ver'} esa información.`,
          timestamp: new Date()
        };
        
        // Navegar después de responder
        setTimeout(() => {
          navigate(aiResponse.payload?.route || '/');
        }, 1500);
      } else if (aiResponse.type === 'GENERAL_RESPONSE') {
        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: aiResponse.message || 'No pude procesar tu consulta',
          timestamp: new Date(),
          suggestions: aiResponse.suggestions
        };
      } else {
        // Ejecutar comando
        const commandResult = await ChatCommandService.executeCommand(aiResponse, {
          supabase,
          userId: user?.id || '',
          invoicesHook,
          suppliersHook,
          paymentsHook
        });

        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: commandResult.message,
          timestamp: new Date(),
          data: commandResult.data
        };
      }

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Lo siento, hubo un error al procesar tu mensaje. ¿Podrías intentarlo de nuevo?',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderInvoiceCard = (invoice: any) => (
    <Card key={invoice.id} className="p-3 bg-secondary/50 border border-border/50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium text-sm">{invoice.invoice_number}</p>
          <p className="text-xs text-muted-foreground">{invoice.supplier?.name}</p>
        </div>
        <Badge 
          variant={
            invoice.status === 'Pagada' ? 'default' : 
            invoice.status === 'Vencida' ? 'destructive' : 'secondary'
          }
        >
          {invoice.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Monto:</span>
          <p className="font-semibold">{formatCurrency(invoice.amount_total)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Vence:</span>
          <p>{formatDate(invoice.due_date)}</p>
        </div>
      </div>
    </Card>
  );

  const renderStatsCard = (stats: any) => (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Estadísticas del Sistema
      </h4>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-2">
          <div>
            <span className="text-muted-foreground">Total Facturas:</span>
            <p className="font-bold text-lg">{stats.total_invoices}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Pendientes:</span>
            <p className="font-semibold text-orange-600">{stats.total_pending}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-muted-foreground">Vencidas:</span>
            <p className="font-semibold text-red-600">{stats.total_overdue}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Pagadas:</span>
            <p className="font-semibold text-green-600">{stats.total_paid}</p>
          </div>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Monto Pendiente:</span>
          <span className="font-semibold">{formatCurrency(stats.total_amount_pending)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Monto Vencido:</span>
          <span className="font-semibold text-red-600">{formatCurrency(stats.total_amount_overdue)}</span>
        </div>
      </div>
    </Card>
  );

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="p-6 border-b bg-background/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Asistente de Facturas</h1>
              <p className="text-sm text-muted-foreground">
                Tu ayudante inteligente para gestionar facturas y pagos
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={`max-w-2xl ${message.type === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* Data visualization */}
                {message.data && (
                  <div className="mt-3 space-y-2">
                    {Array.isArray(message.data) ? (
                      message.data.map((item) => renderInvoiceCard(item))
                    ) : message.data.total_invoices !== undefined ? (
                      renderStatsCard(message.data)
                    ) : null}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString('es-AR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-secondary p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t bg-background/50">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntame sobre facturas, pagos, estadísticas..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button 
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isTyping}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};