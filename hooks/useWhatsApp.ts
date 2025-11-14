/**
 * 🎯 useWhatsApp Hook - Hook principal para manejo de WhatsApp
 * 
 * Hook robusto que integra múltiples estrategias de envío de WhatsApp
 * con detección de dispositivo, fallbacks automáticos y analytics
 * 
 * @author GitHub Copilot
 * @date 28 de Octubre, 2025
 * @version 1.1
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { WhatsAppService, type MessageData, type WhatsAppResult } from '@/utils/whatsappService';

// 🎯 Interfaces y tipos
export interface UseWhatsAppConfig {
  phoneNumber?: string;
  maxUrlLength?: number;
  retryAttempts?: number;
  timeoutMs?: number;
}

export interface UseWhatsAppOptions {
  config?: UseWhatsAppConfig;
  onSuccess?: (result: WhatsAppResult) => void;
  onError?: (error: string, result?: WhatsAppResult) => void;
  autoReset?: boolean;
  resetDelay?: number;
}

export interface UseWhatsAppReturn {
  // Estado
  isLoading: boolean;
  lastError: string | null;
  lastResult: WhatsAppResult | null;
  strategy: string | undefined;
  
  // Acciones
  sendMessage: (data: MessageData) => Promise<WhatsAppResult>;
  resetError: () => void;
  resetState: () => void;
  
  // Información
  canSend: boolean;
  deviceInfo: {
    isMobile: boolean;
    isDesktop: boolean;
    browser: string;
  };
}

// 🔧 Hook principal
export function useWhatsApp(options: UseWhatsAppOptions = {}): UseWhatsAppReturn {
  const {
    config = {},
    onSuccess,
    onError,
    autoReset = false,
    resetDelay = 5000
  } = options;

  // 🎛️ Estados
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<WhatsAppResult | null>(null);
  const [strategy, setStrategy] = useState<string | undefined>(undefined);

  // 📊 Analytics - Simple mock
  const whatsappAnalytics = {
    track: (event: string, data: any) => {
      console.log(`📊 Analytics: ${event}`, data);
    }
  };

  // ⏰ Referencias para timeouts
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🧹 Limpiar timeout
  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  // ⏰ Programar reset automático
  const scheduleAutoReset = useCallback(() => {
    if (autoReset && resetDelay > 0) {
      clearResetTimeout();
      resetTimeoutRef.current = setTimeout(() => {
        setLastError(null);
        setLastResult(null);
      }, resetDelay);
    }
  }, [autoReset, resetDelay, clearResetTimeout]);

  // 🚀 Función principal para enviar mensaje
  const sendMessage = useCallback(async (data: MessageData): Promise<WhatsAppResult> => {
    console.log('🚀 Hook useWhatsApp: Iniciando envío de mensaje');
    
    // 📊 Track: Intento de estrategia
    whatsappAnalytics.track('strategy_attempt', {
      strategy: 'auto',
      messageLength: JSON.stringify(data).length
    });
    
    setIsLoading(true);
    setLastError(null);
    setLastResult(null);
    clearResetTimeout();

    try {
      // 🎯 Usar configuración del hook si está disponible
      const serviceConfig = {
        phoneNumber: config.phoneNumber || "5218711249363",
        maxUrlLength: config.maxUrlLength || 2000,
        retryAttempts: config.retryAttempts || 3,
        timeoutMs: config.timeoutMs || 3000
      };

      console.log('🔧 Configuración del servicio:', serviceConfig);

      // 🚀 Llamar al servicio de WhatsApp
      const whatsappService = new WhatsAppService();
      const result = await whatsappService.sendConfirmation(data);
      
      console.log('✅ Hook useWhatsApp: Resultado exitoso:', result);
      
      setLastResult(result);
      setStrategy(result.strategy);
      setIsLoading(false);
      
      // 📊 Track: Éxito
      whatsappAnalytics.track('message_sent_success', {
        strategy: result.strategy,
        messageLength: JSON.stringify(data).length,
        processingTime: Date.now() - (result as any).startTime || 0
      });
      
      // 🎉 Callback de éxito
      if (onSuccess) {
        onSuccess(result);
      }
      
      scheduleAutoReset();
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error inesperado';
      
      console.error('❌ Hook useWhatsApp: Error inesperado:', error);
      
      // 📊 Track: Error inesperado
      whatsappAnalytics.track('strategy_failure', {
        strategy: 'hook_error',
        errorMessage: errorMsg
      });
      
      setLastError(errorMsg);
      setIsLoading(false);
      
      const errorResult: WhatsAppResult = {
        success: false,
        strategy: 'manual',
        error: errorMsg,
        message: 'Por favor copia el mensaje manualmente',
        fallbackUsed: true
      };
      
      setLastResult(errorResult);
      
      // 📞 Callback de error
      if (onError) {
        onError(errorMsg, errorResult);
      }
      
      scheduleAutoReset();
      return errorResult;
    }
  }, [config, onSuccess, onError, clearResetTimeout, scheduleAutoReset, whatsappAnalytics]);

  // 🧹 Resetear solo error
  const resetError = useCallback(() => {
    setLastError(null);
    clearResetTimeout();
  }, [clearResetTimeout]);

  // 🧹 Resetear todo el estado
  const resetState = useCallback(() => {
    setLastError(null);
    setLastResult(null);
    setStrategy(undefined);
    setIsLoading(false);
    clearResetTimeout();
  }, [clearResetTimeout]);

  // 🧹 Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearResetTimeout();
    };
  }, [clearResetTimeout]);

  // 📱 Información del dispositivo
  const deviceInfo = {
    isMobile: typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent),
    isDesktop: typeof navigator !== 'undefined' && !/Mobi|Android/i.test(navigator.userAgent),
    browser: typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').pop() || 'unknown' : 'unknown'
  };

  // ✅ Estado de disponibilidad
  const canSend = !isLoading;

  return {
    // Estado
    isLoading,
    lastError,
    lastResult,
    strategy,
    
    // Acciones
    sendMessage,
    resetError,
    resetState,
    
    // Información
    canSend,
    deviceInfo
  };
}