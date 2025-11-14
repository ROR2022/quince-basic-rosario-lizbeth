/**
 * 🎯 useAttendanceConfirmation Hook
 * 
 * Hook especializado para confirmaciones de asistencia
 * Pre-configurado con número de teléfono y configuración específica
 */

import { useWhatsApp, UseWhatsAppOptions, UseWhatsAppReturn } from './useWhatsApp';
import { quinceMainData } from '@/components/sections/data/main-data';
const attendanceNumber = quinceMainData.attendance.whatsappNumber || "5217777937484";

/**
 * Hook especializado para confirmaciones de asistencia
 * @param options Opciones adicionales para el hook
 */
export const useAttendanceConfirmation = (options: UseWhatsAppOptions = {}): UseWhatsAppReturn => {
  return useWhatsApp({
    ...options,
    config: {
      phoneNumber: attendanceNumber, // Número específico para confirmaciones
      maxUrlLength: 2000,
      retryAttempts: 3,
      timeoutMs: 3000,
      ...options.config
    }
  });
};