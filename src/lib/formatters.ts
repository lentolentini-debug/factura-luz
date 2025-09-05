import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatCurrency = (amount: number, currency: string = 'ARS'): string => {
  if (currency === 'ARS') {
    return `$${amount.toLocaleString('es-AR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy', { locale: es });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
};

export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) {
    return `Vencida hace ${Math.abs(diffInDays)} día${Math.abs(diffInDays) !== 1 ? 's' : ''}`;
  } else if (diffInDays === 0) {
    return 'Vence hoy';
  } else if (diffInDays === 1) {
    return 'Vence mañana';
  } else {
    return `Vence en ${diffInDays} días`;
  }
};