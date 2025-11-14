/**
 * 📊 WhatsApp Analytics Service
 * 
 * Sistema de logging y analytics para monitorear el rendimiento
 * del sistema WhatsApp y identificar problemas comunes.
 * 
 * @author GitHub Copilot
 * @date 28 de Octubre, 2025
 * @version 1.0
 */

// 🎯 Interfaces para Analytics
export interface WhatsAppAnalyticsEvent {
  id: string;
  timestamp: Date;
  event: WhatsAppEventType;
  data: WhatsAppEventData;
  sessionId: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
}

export type WhatsAppEventType = 
  | 'strategy_attempt'
  | 'strategy_success'
  | 'strategy_failure'
  | 'popup_blocked'
  | 'manual_fallback'
  | 'user_cancelled'
  | 'form_submitted'
  | 'error_modal_shown'
  | 'retry_attempted';

export interface WhatsAppEventData {
  strategy?: string;
  attemptNumber?: number;
  errorMessage?: string;
  userChoice?: string;
  messageLength?: number;
  formData?: {
    nombre: string;
    telefono?: string;
    numeroInvitados: number;
    confirmacion: string;
  };
  result?: {
    success: boolean;
    strategy: string;
    executionTime: number;
  };
}

export interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browser: string;
  deviceType: string;
  screenWidth: number;
  screenHeight: number;
}

export interface AnalyticsSummary {
  totalAttempts: number;
  successRate: number;
  strategiesUsed: Record<string, { attempts: number; successes: number; successRate: number }>;
  commonErrors: Record<string, number>;
  averageRetries: number;
  deviceBreakdown: Record<string, number>;
  mostRecentEvents: WhatsAppAnalyticsEvent[];
}

// 🎯 Clase principal de Analytics
class WhatsAppAnalyticsService {
  private sessionId: string;
  private events: WhatsAppAnalyticsEvent[] = [];
  private isEnabled: boolean = true;
  private maxEvents: number = 1000; // Límite de eventos en memoria

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadEventsFromStorage();
    
    // Deshabilitar en producción si no hay configuración específica
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
  }

  /**
   * 📝 Registrar un evento de analytics
   */
  track(eventType: WhatsAppEventType, data: WhatsAppEventData = {}): void {
    if (!this.isEnabled) return;

    const event: WhatsAppAnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      event: eventType,
      data,
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      deviceInfo: this.getDeviceInfo()
    };

    this.events.push(event);
    
    // Limpiar eventos antiguos si excedemos el límite
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    this.saveEventsToStorage();
    this.logEventToConsole(event);
  }

  /**
   * 📊 Obtener resumen de analytics
   */
  getSummary(): AnalyticsSummary {
    const totalAttempts = this.events.filter(e => e.event === 'strategy_attempt').length;
    const totalSuccesses = this.events.filter(e => e.event === 'strategy_success').length;
    
    const strategiesUsed: Record<string, { attempts: number; successes: number; successRate: number }> = {};
    const commonErrors: Record<string, number> = {};
    const deviceBreakdown: Record<string, number> = {};
    
    let totalRetries = 0;
    let retriesCount = 0;

    this.events.forEach(event => {
      // Estrategias
      if (event.event === 'strategy_attempt' || event.event === 'strategy_success' || event.event === 'strategy_failure') {
        const strategy = event.data.strategy || 'unknown';
        if (!strategiesUsed[strategy]) {
          strategiesUsed[strategy] = { attempts: 0, successes: 0, successRate: 0 };
        }
        
        if (event.event === 'strategy_attempt' || event.event === 'strategy_failure') {
          strategiesUsed[strategy].attempts++;
        }
        if (event.event === 'strategy_success') {
          strategiesUsed[strategy].successes++;
        }
      }

      // Errores comunes
      if (event.event === 'strategy_failure' && event.data.errorMessage) {
        const error = event.data.errorMessage;
        commonErrors[error] = (commonErrors[error] || 0) + 1;
      }

      // Dispositivos
      const deviceType = event.deviceInfo.deviceType;
      deviceBreakdown[deviceType] = (deviceBreakdown[deviceType] || 0) + 1;

      // Reintentos
      if (event.event === 'retry_attempted' && event.data.attemptNumber) {
        totalRetries += event.data.attemptNumber;
        retriesCount++;
      }
    });

    // Calcular tasas de éxito por estrategia
    Object.keys(strategiesUsed).forEach(strategy => {
      const strategy_data = strategiesUsed[strategy];
      strategy_data.successRate = strategy_data.attempts > 0 
        ? (strategy_data.successes / strategy_data.attempts) * 100 
        : 0;
    });

    return {
      totalAttempts,
      successRate: totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0,
      strategiesUsed,
      commonErrors,
      averageRetries: retriesCount > 0 ? totalRetries / retriesCount : 0,
      deviceBreakdown,
      mostRecentEvents: this.events.slice(-10).reverse()
    };
  }

  /**
   * 🔍 Obtener eventos filtrados
   */
  getEvents(filter?: {
    eventType?: WhatsAppEventType;
    strategy?: string;
    lastN?: number;
    fromDate?: Date;
  }): WhatsAppAnalyticsEvent[] {
    let filteredEvents = [...this.events];

    if (filter?.eventType) {
      filteredEvents = filteredEvents.filter(e => e.event === filter.eventType);
    }

    if (filter?.strategy) {
      filteredEvents = filteredEvents.filter(e => e.data.strategy === filter.strategy);
    }

    if (filter?.fromDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= filter.fromDate!);
    }

    if (filter?.lastN) {
      filteredEvents = filteredEvents.slice(-filter.lastN);
    }

    return filteredEvents.reverse();
  }

  /**
   * 📤 Exportar datos para análisis
   */
  exportData(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportDate: new Date(),
      summary: this.getSummary(),
      events: this.events
    }, null, 2);
  }

  /**
   * 🧹 Limpiar datos
   */
  clearData(): void {
    this.events = [];
    this.saveEventsToStorage();
    console.log('🧹 Analytics data cleared');
  }

  // 🔧 Métodos privados
  private generateSessionId(): string {
    return `whatsapp-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        browser: 'Unknown',
        deviceType: 'Server',
        screenWidth: 0,
        screenHeight: 0
      };
    }

    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    
    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    return {
      isMobile,
      isIOS,
      isAndroid,
      browser,
      deviceType: isMobile ? (isIOS ? 'iOS' : isAndroid ? 'Android' : 'Mobile') : 'Desktop',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
  }

  private saveEventsToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('whatsapp-analytics', JSON.stringify({
          sessionId: this.sessionId,
          events: this.events.slice(-100) // Solo guardar los últimos 100 eventos
        }));
      }
    } catch (error) {
      console.warn('Could not save analytics to localStorage:', error);
    }
  }

  private loadEventsFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('whatsapp-analytics');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.sessionId === this.sessionId && data.events) {
            this.events = data.events.map((e: any) => ({
              ...e,
              timestamp: new Date(e.timestamp)
            }));
          }
        }
      }
    } catch (error) {
      console.warn('Could not load analytics from localStorage:', error);
    }
  }

  private logEventToConsole(event: WhatsAppAnalyticsEvent): void {
    if (process.env.NODE_ENV === 'development') {
      const emoji = this.getEventEmoji(event.event);
      console.log(`📊 ${emoji} Analytics: ${event.event}`, {
        data: event.data,
        device: event.deviceInfo.deviceType,
        timestamp: event.timestamp
      });
    }
  }

  private getEventEmoji(eventType: WhatsAppEventType): string {
    const emojiMap: Record<WhatsAppEventType, string> = {
      'strategy_attempt': '🎯',
      'strategy_success': '✅',
      'strategy_failure': '❌',
      'popup_blocked': '🚫',
      'manual_fallback': '📋',
      'user_cancelled': '🚪',
      'form_submitted': '📝',
      'error_modal_shown': '⚠️',
      'retry_attempted': '🔄'
    };
    
    return emojiMap[eventType] || '📊';
  }
}

// 🌍 Instancia singleton global
export const whatsappAnalytics = new WhatsAppAnalyticsService();

// 🎮 Hook para usar analytics en componentes React
export const useWhatsAppAnalytics = () => {
  return {
    track: whatsappAnalytics.track.bind(whatsappAnalytics),
    getSummary: whatsappAnalytics.getSummary.bind(whatsappAnalytics),
    getEvents: whatsappAnalytics.getEvents.bind(whatsappAnalytics),
    exportData: whatsappAnalytics.exportData.bind(whatsappAnalytics),
    clearData: whatsappAnalytics.clearData.bind(whatsappAnalytics)
  };
};