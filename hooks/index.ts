// Exportaciones centralizadas para hooks de QR Download

export { useQRDownload } from './useQRDownload';
export { useQRGeneration } from './useQRGeneration';

// Exportaciones centralizadas para hooks de WhatsApp
export { useWhatsApp } from './useWhatsApp';
export { useAttendanceConfirmation } from './useAttendanceConfirmation';

// Re-exportar tipos relevantes
export type {
  QREventData,
  DownloadFormat,
  QRDownloadState,
  QRDownloadHook
} from '@/types/qrDownload.types';

// Re-exportar tipos de WhatsApp
export type {
  UseWhatsAppOptions,
  UseWhatsAppReturn
} from './useWhatsApp';
