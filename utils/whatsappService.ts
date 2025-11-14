/**
 * 📱 WhatsApp Service - Servicio centralizado para manejo de WhatsApp
 * 
 * Proporciona múltiples estrategias para abrir WhatsApp según el dispositivo
 * y maneja fallbacks automáticos en caso de fallo.
 * 
 * @author GitHub Copilot
 * @date 28 de Octubre, 2025
 * @version 2.0
 */

import { quinceMainData } from "@/components/sections/data/main-data";
const defaultPhoneNumber = quinceMainData.attendance.whatsappNumber || "5217777937484";

// 🎯 Interfaces y tipos
export interface WhatsAppConfig {
  phoneNumber: string;
  maxUrlLength: number;
  retryAttempts: number;
  timeoutMs: number;
}

export interface MessageData {
  name: string;
  phone?: string;
  attendance: 'si' | 'no';
  guests: number;
  comments?: string;
}

export interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  browser: string;
  strategy: WhatsAppStrategy;
}

export type WhatsAppStrategy = 'native' | 'web' | 'api' | 'manual';

export interface WhatsAppResult {
  success: boolean;
  strategy: WhatsAppStrategy;
  error?: string;
  message: string;
  urlLength?: number;
  fallbackUsed?: boolean;
}

// 🔧 Configuración por defecto
const DEFAULT_CONFIG: WhatsAppConfig = {
  phoneNumber: defaultPhoneNumber,
  maxUrlLength: 2000,
  retryAttempts: 3,
  timeoutMs: 3000
};

/**
 * 🏭 Clase principal del servicio WhatsApp
 */
export class WhatsAppService {
  private config: WhatsAppConfig;

  constructor(config: Partial<WhatsAppConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 🎯 Método principal para enviar confirmación
   */
  public async sendConfirmation(data: MessageData): Promise<WhatsAppResult> {
    try {
      console.log('🚀 Iniciando envío de confirmación WhatsApp:', data);
      
      // 1. Detectar dispositivo
      const deviceInfo = this.detectDevice();
      console.log('📱 Dispositivo detectado:', deviceInfo);

      // 2. Construir mensaje
      const message = this.buildMessage(data);
      const validation = this.validateMessage(message);
      
      if (!validation.isValid) {
        console.log('⚠️ Mensaje muy largo, usando versión corta');
        const shortMessage = this.buildShortMessage(data);
        return await this.executeStrategy(deviceInfo, shortMessage, true);
      }

      // 3. Ejecutar estrategia principal
      return await this.executeStrategy(deviceInfo, message, false);

    } catch (error) {
      console.error('❌ Error en sendConfirmation:', error);
      return {
        success: false,
        strategy: 'manual',
        error: error instanceof Error ? error.message : 'Error desconocido',
        message: 'Error al procesar confirmación'
      };
    }
  }

  /**
   * 🔍 Detecta el tipo de dispositivo y navegador
   */
  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isDesktop = !isMobile;

    // Detectar navegador
    let browser = 'unknown';
    if (userAgent.includes('chrome')) browser = 'chrome';
    else if (userAgent.includes('firefox')) browser = 'firefox';
    else if (userAgent.includes('safari')) browser = 'safari';
    else if (userAgent.includes('edge')) browser = 'edge';

    // Determinar estrategia principal
    let strategy: WhatsAppStrategy = 'web';
    if (isMobile) {
      strategy = 'native';
    } else if (isDesktop) {
      strategy = 'web';
    }

    return {
      isMobile,
      isIOS,
      isAndroid,
      isDesktop,
      browser,
      strategy
    };
  }

  /**
   * 📝 Construye el mensaje completo
   */
  private buildMessage(data: MessageData): string {
    const confirmacionTexto = data.attendance === "si" 
      ? "✅ ¡Confirmo mi asistencia!" 
      : "❌ No podré asistir";

    const invitadosTexto = data.guests === 1 
      ? "1 persona" 
      : `${data.guests} personas`;

    return `🎉 *CONFIRMACIÓN DE ASISTENCIA* 🎉

👤 *Nombre:* ${data.name}
${data.phone ? `📱 *Teléfono:* ${data.phone}` : ""}

${confirmacionTexto}
👥 *Número de invitados:* ${invitadosTexto}

${data.comments ? `💌 *Mensaje especial:*\n${data.comments}` : ""}

¡Gracias por responder! 💖✨`;
  }

  /**
   * 📝 Construye el mensaje corto (fallback)
   */
  private buildShortMessage(data: MessageData): string {
    const confirmacionTexto = data.attendance === "si" ? "Asistiré" : "No asistiré";
    return `Confirmación XV años Ximena: ${data.name} - ${confirmacionTexto} - ${data.guests} persona(s)`;
  }

  /**
   * ✅ Valida la longitud del mensaje
   */
  private validateMessage(message: string): { isValid: boolean; urlLength: number } {
    const encodedMessage = encodeURIComponent(message);
    const testUrl = `https://wa.me/${this.config.phoneNumber}?text=${encodedMessage}`;
    
    return {
      isValid: testUrl.length <= this.config.maxUrlLength,
      urlLength: testUrl.length
    };
  }

  /**
   * 🎯 Ejecuta la estrategia seleccionada con fallbacks
   */
  private async executeStrategy(
    deviceInfo: DeviceInfo, 
    message: string, 
    fallbackUsed: boolean
  ): Promise<WhatsAppResult> {
    
    // Estrategias ordenadas por prioridad
    const strategies: WhatsAppStrategy[] = this.getStrategiesByDevice(deviceInfo);
    
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      
      try {
        console.log(`🎯 Intentando estrategia ${i + 1}/${strategies.length}: ${strategy}`);
        
        const result = await this.tryStrategy(strategy, message, deviceInfo);
        
        if (result.success) {
          console.log(`✅ Estrategia ${strategy} exitosa`);
          return {
            ...result,
            fallbackUsed,
            strategy
          };
        }
        
        console.log(`❌ Estrategia ${strategy} falló:`, result.error);
        
      } catch (error) {
        console.log(`❌ Error en estrategia ${strategy}:`, error);
      }
    }

    // Si todas las estrategias fallan, usar manual
    console.log('🚨 Todas las estrategias automáticas fallaron, usando manual');
    return await this.useManualFallback(message);
  }

  /**
   * 📋 Obtiene estrategias ordenadas por dispositivo
   */
  private getStrategiesByDevice(deviceInfo: DeviceInfo): WhatsAppStrategy[] {
    if (deviceInfo.isMobile) {
      return ['native', 'api', 'web', 'manual'];
    } else {
      return ['web', 'api', 'manual'];
    }
  }

  /**
   * 🧪 Intenta una estrategia específica
   */
  private async tryStrategy(
    strategy: WhatsAppStrategy, 
    message: string, 
    deviceInfo: DeviceInfo
  ): Promise<WhatsAppResult> {
    
    switch (strategy) {
      case 'native':
        return await this.tryNativeApp(message, deviceInfo);
      
      case 'web':
        return await this.tryWebInterface(message);
      
      case 'api':
        return await this.tryApiInterface(message, deviceInfo);
      
      case 'manual':
        return await this.useManualFallback(message);
      
      default:
        throw new Error(`Estrategia no soportada: ${strategy}`);
    }
  }

  /**
   * 📱 Intenta abrir WhatsApp nativo (móvil)
   */
  private async tryNativeApp(message: string, deviceInfo: DeviceInfo): Promise<WhatsAppResult> {
    return new Promise((resolve) => {
      try {
        const encodedMessage = encodeURIComponent(message);
        const nativeUrl = `whatsapp://send?phone=${this.config.phoneNumber}&text=${encodedMessage}`;
        
        console.log('📱 Intentando URL nativa:', nativeUrl);
        
        // Para iOS, usar location.href
        if (deviceInfo.isIOS) {
          window.location.href = nativeUrl;
        } else {
          // Para Android, intentar abrir en nueva ventana
          const popup = window.open(nativeUrl, '_blank');
          if (!popup) {
            throw new Error('No se pudo abrir ventana');
          }
        }
        
        // Simular éxito después de timeout
        setTimeout(() => {
          resolve({
            success: true,
            strategy: 'native',
            message: 'WhatsApp nativo abierto exitosamente'
          });
        }, 1000);
        
      } catch (error) {
        resolve({
          success: false,
          strategy: 'native',
          error: error instanceof Error ? error.message : 'Error desconocido',
          message: 'Fallo al abrir WhatsApp nativo'
        });
      }
    });
  }

  /**
   * 🌐 Intenta abrir WhatsApp Web
   */
  private async tryWebInterface(message: string): Promise<WhatsAppResult> {
    return new Promise((resolve) => {
      try {
        const encodedMessage = encodeURIComponent(message);
        const webUrl = `https://wa.me/${this.config.phoneNumber}?text=${encodedMessage}`;
        
        console.log('🌐 Intentando URL web:', webUrl);
        
        const popup = window.open(webUrl, '_blank', 'noopener,noreferrer');
        
        if (!popup) {
          throw new Error('Pop-up bloqueado');
        }
        
        // Verificar si se abrió correctamente
        setTimeout(() => {
          if (popup.closed) {
            resolve({
              success: false,
              strategy: 'web',
              error: 'Ventana cerrada inmediatamente',
              message: 'Pop-up cerrado por el navegador'
            });
          } else {
            resolve({
              success: true,
              strategy: 'web',
              message: 'WhatsApp Web abierto exitosamente',
              urlLength: webUrl.length
            });
          }
        }, 1000);
        
      } catch (error) {
        resolve({
          success: false,
          strategy: 'web',
          error: error instanceof Error ? error.message : 'Error desconocido',
          message: 'Fallo al abrir WhatsApp Web'
        });
      }
    });
  }

  /**
   * 🔌 Intenta usar API de WhatsApp (móvil web)
   */
  private async tryApiInterface(message: string, deviceInfo: DeviceInfo): Promise<WhatsAppResult> {
    return new Promise((resolve) => {
      try {
        const encodedMessage = encodeURIComponent(message);
        const apiUrl = `https://api.whatsapp.com/send?phone=${this.config.phoneNumber}&text=${encodedMessage}`;
        
        console.log('🔌 Intentando API WhatsApp:', apiUrl);
        
        if (deviceInfo.isMobile) {
          window.location.href = apiUrl;
          
          setTimeout(() => {
            resolve({
              success: true,
              strategy: 'api',
              message: 'WhatsApp API usado exitosamente'
            });
          }, 1000);
        } else {
          // En desktop, usar como fallback con popup
          const popup = window.open(apiUrl, '_blank');
          
          if (!popup) {
            throw new Error('Pop-up bloqueado');
          }
          
          setTimeout(() => {
            resolve({
              success: true,
              strategy: 'api',
              message: 'WhatsApp API abierto en nueva ventana'
            });
          }, 1000);
        }
        
      } catch (error) {
        resolve({
          success: false,
          strategy: 'api',
          error: error instanceof Error ? error.message : 'Error desconocido',
          message: 'Fallo al usar API de WhatsApp'
        });
      }
    });
  }

  /**
   * 📋 Fallback manual - copiar al portapapeles
   */
  private async useManualFallback(message: string): Promise<WhatsAppResult> {
    try {
      await navigator.clipboard.writeText(message);
      
      const phoneFormatted = `+${this.config.phoneNumber}`;
      alert(`✅ ¡Mensaje copiado al portapapeles!\n\nAhora abre WhatsApp manualmente y envía el mensaje a:\n${phoneFormatted}`);
      
      return {
        success: true,
        strategy: 'manual',
        message: 'Mensaje copiado al portapapeles exitosamente'
      };
      
    } catch (error) {
      // Fallback del fallback - mostrar prompt
      const phoneFormatted = `+${this.config.phoneNumber}`;
      prompt(
        `Copia este mensaje y envíalo por WhatsApp a ${phoneFormatted}:`, 
        message
      );
      
      return {
        success: true,
        strategy: 'manual',
        message: 'Mensaje mostrado para copia manual'
      };
    }
  }

  /**
   * 🔧 Configurar el servicio
   */
  public updateConfig(newConfig: Partial<WhatsAppConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Configuración actualizada:', this.config);
  }
}

// 🏭 Instancia singleton del servicio
let whatsappServiceInstance: WhatsAppService | null = null;

/**
 * 🎯 Factory function para obtener instancia del servicio
 */
export const getWhatsAppService = (config?: Partial<WhatsAppConfig>): WhatsAppService => {
  if (!whatsappServiceInstance) {
    whatsappServiceInstance = new WhatsAppService(config);
  } else if (config) {
    whatsappServiceInstance.updateConfig(config);
  }
  
  return whatsappServiceInstance;
};

/**
 * 🧪 Función de utilidad para testing rápido
 */
export const testWhatsAppService = async (): Promise<void> => {
  console.log('🧪 Iniciando test del servicio WhatsApp...');
  
  const service = getWhatsAppService();
  const testData: MessageData = {
    name: 'Usuario de Prueba',
    attendance: 'si',
    guests: 2,
    comments: 'Mensaje de prueba'
  };
  
  const result = await service.sendConfirmation(testData);
  console.log('🧪 Resultado del test:', result);
};