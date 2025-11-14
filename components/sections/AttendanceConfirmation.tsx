import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import {
  Phone,
  Heart,
  Sparkles,
  User,
  MessageCircle,
  Users,
  CheckCircle,
} from "lucide-react";
import { quinceMainData } from "@/components/sections/data/main-data";
import BackgroundCarrousel from "./BackgroundCarrousel";
import { useAttendanceConfirmation } from "@/hooks";
import type { MessageData } from "@/utils/whatsappService";
import { WhatsAppFeedback, WhatsAppFeedbackStyles } from "./WhatsAppFeedback";
import { StrategyProgress } from "./StrategyProgress";
import { useWhatsAppAnalytics } from "@/utils/whatsappAnalytics";
// import { AnalyticsDashboard } from "./AnalyticsDashboard"; // TEMPORALMENTE DESHABILITADO

const AttendanceConfirmation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    numeroInvitados: 1,
    confirmacion: "si", // 'si' o 'no'
    mensaje: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  // Eliminado: const [showPopupModal, setShowPopupModal] = useState(false); - Ahora usamos whatsappError del hook
  
  // ðŸŽ¯ Estados para retroalimentaciÃ³n avanzada
  const [attemptCount, setAttemptCount] = useState(0);
  const [currentStrategy, setCurrentStrategy] = useState<string | undefined>(undefined);

  // ðŸ“Š Hook de Analytics
  const analytics = useWhatsAppAnalytics();

  // 🆕 Hook de WhatsApp para confirmaciones
  const {
    sendMessage,
    isLoading: isWhatsAppLoading,
    lastError: whatsappError,
    lastResult: whatsappResult,
    strategy: whatsappStrategy,
    resetError: resetWhatsAppError,
    canSend
  } = useAttendanceConfirmation({
    onSuccess: (result) => {
      console.log('âœ… WhatsApp enviado exitosamente:', result);
      setShowSuccess(true);
      resetWhatsAppError(); // Limpiar errores en Ã©xito
      
      // ðŸŽ¯ Reiniciar contadores de feedback
      setAttemptCount(0);
      setCurrentStrategy(result.strategy);
      
      // Limpiar formulario despuÃ©s de Ã©xito
      setTimeout(() => {
        setFormData({
          nombre: "",
          telefono: "",
          numeroInvitados: 1,
          confirmacion: "si",
          mensaje: "",
        });
        setShowSuccess(false);
      }, 3000);
    },
    onError: (error, result) => {
      console.error('âŒ Error al enviar WhatsApp:', error);
      
      // Si la estrategia manual fue exitosa, no mostrar como error
      if (result?.strategy === 'manual' && result?.success) {
        setShowSuccess(true);
        resetWhatsAppError(); // Limpiar errores para estrategia manual exitosa
        return;
      }
      
      // Para otros errores, el hook ya maneja whatsappError automÃ¡ticamente
    },
    autoReset: true,
    resetDelay: 5000
  });

  const { attendance, event } = quinceMainData;
  const parents = event.parents;

  // NÃºmero de WhatsApp de destino (ahora viene del hook)
  const whatsappNumber = attendance.whatsappNumber;

  // IntersectionObserver para animaciones escalonadas
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '50px',
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // FunciÃ³n mejorada para detectar si los pop-ups estÃ¡n bloqueados
  const checkPopupBlocked = async () => {
    try {
      // MÃ©todo mÃ¡s robusto de detecciÃ³n
      const popup = window.open('', 'test', 'width=1,height=1,left=0,top=0');
      
      if (!popup) {
        return true; // Definitivamente bloqueado
      }

      // Verificar si el popup realmente se abriÃ³
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const isBlocked = popup.closed || popup.innerWidth === undefined;
      
      // Cerrar el popup de prueba
      if (!popup.closed) {
        popup.close();
      }
      
      return isBlocked;
    } catch (error) {
      console.log('ðŸš« Error en detecciÃ³n de pop-ups:', error);
      return true; // En caso de error, asumir que estÃ¡n bloqueados
    }
  };

  // FunciÃ³n para detectar dispositivo y navegador
  const getDeviceAndBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    
    return {
      isMobile,
      isIOS,
      isAndroid,
      userAgent,
      isChromeMobile: isMobile && userAgent.includes('Chrome'),
      isFirefoxMobile: isMobile && userAgent.includes('Firefox'),
      isSafariMobile: isIOS && userAgent.includes('Safari'),
    };
  };

  // FunciÃ³n para obtener instrucciones especÃ­ficas por navegador y dispositivo
  const getBrowserInstructions = () => {
    const deviceInfo = getDeviceAndBrowserInfo();
    
    // Instrucciones para dispositivos mÃ³viles
    if (deviceInfo.isMobile) {
      if (deviceInfo.isIOS) {
        return {
          title: "ðŸ“± iPhone/iPad",
          steps: [
            "1. Ve a ConfiguraciÃ³n de tu iPhone",
            "2. Busca y toca 'Safari'", 
            "3. Desactiva 'Bloquear ventanas emergentes'",
            "4. Regresa aquÃ­ y confirma de nuevo"
          ],
          showAlternative: true
        };
      }
      
      if (deviceInfo.isAndroid) {
        return {
          title: "ðŸ“± Android",
          steps: [
            "1. Toca los 3 puntos â‹® (esquina superior)",
            "2. ConfiguraciÃ³n â†’ ConfiguraciÃ³n de sitios",
            "3. 'Ventanas emergentes' â†’ Permitir",
            "4. Regresa y confirma de nuevo"
          ],
          showAlternative: true
        };
      }
      
      // MÃ³vil genÃ©rico
      return {
        title: "ðŸ“± TelÃ©fono mÃ³vil",
        steps: [
          "1. Busca el menÃº de configuraciÃ³n del navegador",
          "2. Encuentra 'Pop-ups' o 'Ventanas emergentes'",
          "3. PermÃ­telos para este sitio",
          "4. Regresa e intenta de nuevo"
        ],
        showAlternative: true
      };
    }
    
    // Instrucciones para escritorio (mantenemos las originales)
    if (deviceInfo.userAgent.includes('Chrome')) {
      return {
        title: "ðŸ–¥ï¸ Chrome",
        steps: [
          "1. Busca el Ã­cono ðŸš« en la barra de direcciones",
          "2. Haz clic en Ã©l y selecciona 'Permitir pop-ups'"
        ],
        showAlternative: false
      };
    }
    
    if (deviceInfo.userAgent.includes('Firefox')) {
      return {
        title: "ðŸ–¥ï¸ Firefox", 
        steps: [
          "1. Busca el escudo ðŸ›¡ï¸ junto a la direcciÃ³n",
          "2. Clic â†’ Desactivar 'Bloquear ventanas emergentes'"
        ],
        showAlternative: false
      };
    }
    
    if (deviceInfo.userAgent.includes('Safari')) {
      return {
        title: "ðŸ–¥ï¸ Safari",
        steps: [
          "1. Safari â†’ Preferencias â†’ Sitios web",
          "2. Ventanas emergentes â†’ Permitir para este sitio"
        ],
        showAlternative: false
      };
    }
    
    if (deviceInfo.userAgent.includes('Edge')) {
      return {
        title: "ðŸ–¥ï¸ Edge",
        steps: [
          "1. Busca el Ã­cono ðŸš« en la barra de direcciones",
          "2. Clic â†’ 'Permitir ventanas emergentes'"
        ],
        showAlternative: false
      };
    }
    
    // Fallback genÃ©rico
    return {
      title: "ðŸŒ Navegador",
      steps: [
        "Busca el Ã­cono de pop-ups bloqueados en tu navegador",
        "y permÃ­telos para este sitio"
      ],
      showAlternative: deviceInfo.isMobile
    };
  };

  // FunciÃ³n para construir mensaje corto (fallback)
  const buildShortMessage = () => {
    const confirmacionTexto = formData.confirmacion === "si" ? "AsistirÃ©" : "No asistirÃ©";
    return `ConfirmaciÃ³n XV aÃ±os Ximena: ${formData.nombre} - ${confirmacionTexto} - ${formData.numeroInvitados} persona(s)`;
  };

  // FunciÃ³n para construir mensaje completo
  const buildFullMessage = () => {
    const confirmacionTexto =
      formData.confirmacion === "si"
        ? "âœ… Â¡Confirmo mi asistencia!"
        : "âŒ No podrÃ© asistir";

    const invitadosTexto =
      formData.numeroInvitados === 1
        ? "1 persona"
        : `${formData.numeroInvitados} personas`;

    return `ðŸŽ‰ *CONFIRMACIÃ“N DE ASISTENCIA* ðŸŽ‰

ðŸ‘¤ *Nombre:* ${formData.nombre}
${formData.telefono ? `ðŸ“± *TelÃ©fono:* ${formData.telefono}` : ""}

${confirmacionTexto}
ðŸ‘¥ *NÃºmero de invitados:* ${invitadosTexto}

${formData.mensaje ? `ðŸ’Œ *Mensaje especial:*\n${formData.mensaje}` : ""}

Â¡Gracias por responder! ðŸ’–âœ¨`;
  };

  // FunciÃ³n para validar longitud de URL
  const validateUrlLength = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const testUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    const MAX_URL_LENGTH = 2000; // LÃ­mite conservador para URLs
    
    return {
      isValid: testUrl.length <= MAX_URL_LENGTH,
      urlLength: testUrl.length,
      messageLength: message.length
    };
  };

  // ðŸŽ¯ FunciÃ³n principal de procesamiento de confirmaciÃ³n
  const processConfirmation = async () => {
    // ValidaciÃ³n simple
    if (!formData.nombre.trim()) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    try {
      // ðŸ“Š Actualizar feedback de intento y estrategia
      setAttemptCount(prev => prev + 1);
      setCurrentStrategy(whatsappStrategy || 'auto');
      
      // ðŸ†• Usar el nuevo hook para enviar mensaje
      const messageData: MessageData = {
        name: formData.nombre.trim(),
        phone: formData.telefono?.trim() || undefined,
        attendance: formData.confirmacion as 'si' | 'no',
        guests: formData.numeroInvitados,
        comments: formData.mensaje?.trim() || undefined
      };

      console.log('ðŸŽ¯ Enviando confirmaciÃ³n con nuevo sistema:', messageData);

      // ðŸŽ¯ NUEVA FUNCIONALIDAD: Llamar al endpoint de confirmaciÃ³n automÃ¡tica
      const confirmationData = {
        name: formData.nombre.trim(),
        numberOfGuests: formData.numeroInvitados,
        willAttend: formData.confirmacion === "si",
        comments: formData.mensaje?.trim() || undefined,
        phone: formData.telefono?.trim() || undefined,
      };

      console.log("ðŸŽ¯ Enviando confirmaciÃ³n automÃ¡tica...", confirmationData);

      const response = await fetch("/api/guests/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(confirmationData),
      });

      const result = await response.json();

      if (result.success) {
        // Log transparente para debugging
        console.log("ðŸŽ¯ ConfirmaciÃ³n procesada exitosamente:", {
          action: result.action,
          guest: result.guest.name,
          similarity: result.matchInfo?.similarity,
          matchType: result.matchInfo?.matchType,
          willAttend: confirmationData.willAttend,
          numberOfGuests: confirmationData.numberOfGuests,
        });

        if (result.action === "updated") {
          const matchMethod =
            result.matchInfo?.matchMethod === "phone" ? "telÃ©fono" : "nombre";
          const conflictInfo = result.matchInfo?.hasConflict
            ? " (âš ï¸ nÃºmeros diferentes)"
            : "";
          console.log(
            `âœ… Invitado actualizado por ${matchMethod}: "${
              result.guest.name
            }" (${result.matchInfo?.similarity?.toFixed(
              1
            )}% similitud)${conflictInfo}`
          );

          if (result.matchInfo?.hasConflict) {
            console.log(
              `âš ï¸ Se detectÃ³ un conflicto de telÃ©fono - verificar manualmente`
            );
          }
        } else if (result.action === "created") {
          console.log(`ðŸ†• Nuevo invitado creado: "${result.guest.name}"`);
          if (result.matchInfo?.multipleMatches) {
            console.log(
              `âš ï¸ BÃºsqueda ambigua: ${result.matchInfo.matchesCount} coincidencias similares encontradas`
            );
          }
        }
      } else {
        console.error("âŒ Error en confirmaciÃ³n automÃ¡tica:", result.message);
      }

      // ðŸ†• Enviar mensaje de WhatsApp usando el nuevo sistema
      await sendMessage(messageData);

    } catch (error) {
      console.error("âŒ Error procesando confirmaciÃ³n automÃ¡tica:", error);
      // El hook maneja los errores automÃ¡ticamente
    }
  };

  const copyMessageToClipboard = async () => {
    if (!formData.nombre.trim()) {
      alert("Por favor ingresa tu nombre primero");
      return;
    }

    // Intentar mensaje completo primero
    let mensaje = buildFullMessage();
    let validation = validateUrlLength(mensaje);

    // Si es muy largo, usar mensaje corto
    if (!validation.isValid) {
      console.log(`âš ï¸ Mensaje muy largo (${validation.urlLength} chars), usando versiÃ³n corta`);
      mensaje = buildShortMessage();
      validation = validateUrlLength(mensaje);
    }

    console.log('ï¿½ Mensaje seleccionado:', {
      type: mensaje === buildFullMessage() ? 'completo' : 'corto',
      messageLength: validation.messageLength,
      urlLength: validation.urlLength,
      isValid: validation.isValid
    });

    try {
      await navigator.clipboard.writeText(mensaje);
      
      // ðŸ“Š Track: Copia exitosa
      analytics.track('manual_fallback', {
        strategy: 'clipboard_copy',
        messageLength: validation.messageLength,
        userChoice: 'copy_to_clipboard'
      });
      
      alert(`âœ… Â¡Mensaje copiado! Ahora abre WhatsApp y envÃ­alo a:\n+${whatsappNumber}`);
      resetWhatsAppError(); // Limpiar errores despuÃ©s de copiar
      
      // Procesar confirmaciÃ³n automÃ¡tica en backend
      processConfirmation();
    } catch (error) {
      // ðŸ“Š Track: Fallback a prompt
      analytics.track('manual_fallback', {
        strategy: 'prompt_fallback',
        messageLength: validation.messageLength,
        userChoice: 'manual_prompt'
      });
      
      // Fallback si no funciona clipboard API
      prompt("Copia este mensaje y envÃ­alo por WhatsApp:", mensaje);
      resetWhatsAppError(); // Limpiar errores despuÃ©s de copiar
      processConfirmation();
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "numeroInvitados" ? parseInt(value) || 1 : value,
    }));
  };

  const handleConfirmAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    // ðŸ“Š Track: EnvÃ­o de formulario
    analytics.track('form_submitted', {
      formData: {
        nombre: formData.nombre,
        telefono: formData.telefono,
        numeroInvitados: formData.numeroInvitados,
        confirmacion: formData.confirmacion
      }
    });

    // ðŸ†• El nuevo hook maneja toda la lÃ³gica de detecciÃ³n y fallbacks
    await processConfirmation();
  };


  // Componente Modal Inteligente para Errores de WhatsApp
  const IntelligentErrorModal = () => {
    const instructions = getBrowserInstructions();
    const deviceInfo = getDeviceAndBrowserInfo();
    
    // Simplificado: usamos whatsappError como string
    const errorMessage = whatsappError || 'Error desconocido';
    const isPopupError = errorMessage.toLowerCase().includes('popup') || errorMessage.toLowerCase().includes('bloqueado');
    
    // ðŸ“Š Track: Modal de error mostrado
    React.useEffect(() => {
      analytics.track('error_modal_shown', {
        errorMessage,
        strategy: whatsappStrategy || 'unknown'
      });
      
      if (isPopupError) {
        analytics.track('popup_blocked', {
          strategy: whatsappStrategy || 'unknown',
          errorMessage
        });
      }
    }, [errorMessage, isPopupError, whatsappStrategy]);
    
    const getErrorIcon = () => {
      if (isPopupError) return 'ðŸš«âž¡ï¸ðŸ“±';
      if (errorMessage.toLowerCase().includes('dispositivo')) return 'ðŸ“±âš ï¸';
      if (errorMessage.toLowerCase().includes('conexiÃ³n') || errorMessage.toLowerCase().includes('red')) return 'ðŸ“¶âŒ';
      if (errorMessage.toLowerCase().includes('validaciÃ³n')) return 'ðŸ“âŒ';
      return 'âŒðŸ”§';
    };

    const getErrorTitle = () => {
      if (isPopupError) return 'Pop-ups Bloqueados';
      if (errorMessage.toLowerCase().includes('dispositivo')) return 'Dispositivo no Compatible';
      if (errorMessage.toLowerCase().includes('conexiÃ³n') || errorMessage.toLowerCase().includes('red')) return 'Error de ConexiÃ³n';
      if (errorMessage.toLowerCase().includes('validaciÃ³n')) return 'Error de ValidaciÃ³n';
      return 'Error de WhatsApp';
    };

    const getErrorDescription = () => {
      if (isPopupError) return 'Para abrir WhatsApp automÃ¡ticamente:';
      if (errorMessage.toLowerCase().includes('dispositivo')) return 'Tu dispositivo necesita una configuraciÃ³n especial:';
      if (errorMessage.toLowerCase().includes('conexiÃ³n') || errorMessage.toLowerCase().includes('red')) return 'Hubo un problema de conexiÃ³n:';
      if (errorMessage.toLowerCase().includes('validaciÃ³n')) return 'Revisa los datos ingresados:';
      return 'Se encontrÃ³ un problema:';
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white p-6 rounded-3xl max-w-md w-full text-center shadow-2xl border-2 max-h-[90vh] overflow-y-auto"
          style={{
            background: "linear-gradient(135deg, rgba(255, 179, 217, 0.15) 0%, rgba(248, 246, 240, 0.98) 25%, rgba(230, 217, 255, 0.15) 50%, rgba(255, 242, 204, 0.2) 75%, rgba(253, 252, 252, 0.98) 100%)",
            borderImage: "linear-gradient(45deg, var(--color-aurora-oro), var(--color-aurora-rosa), var(--color-aurora-lavanda)) 1",
          }}
        >
          {/* Ãcono dinÃ¡mico */}
          <div className="text-5xl mb-4">{getErrorIcon()}</div>
          
          <h3 
            className="text-xl font-bold mb-3"
            style={{ color: "var(--color-aurora-lavanda)" }}
          >
            {getErrorTitle()}
          </h3>
          
          <p 
            className="text-base mb-4 leading-relaxed"
            style={{ color: "var(--color-aurora-rosa)" }}
          >
            {getErrorDescription()}
          </p>
          
          {/* Mensaje de error especÃ­fico */}
          {errorMessage && (
            <div 
              className="p-3 rounded-xl mb-4 text-sm border"
              style={{
                backgroundColor: "rgba(255, 179, 217, 0.1)",
                borderColor: "rgba(255, 179, 217, 0.3)",
                color: "var(--color-aurora-lavanda)"
              }}
            >
              {errorMessage}
            </div>
          )}
          
          {/* Instrucciones especÃ­ficas para pop-ups */}
          {isPopupError && (
            <div 
              className="p-4 rounded-2xl mb-4 text-left border"
              style={{
                backgroundColor: "rgba(255, 242, 204, 0.3)",
                borderColor: "rgba(255, 179, 217, 0.3)",
                color: "var(--color-aurora-lavanda)"
              }}
            >
              <h4 className="font-bold mb-2 text-center">{instructions.title}</h4>
              <div className="text-sm leading-relaxed">
                {instructions.steps.map((step, index) => (
                  <div key={index} className="mb-1">{step}</div>
                ))}
              </div>
            </div>
          )}

          {/* Alternativa universal */}
          <div 
            className="p-3 rounded-xl mb-4 text-center border-2 border-dashed"
            style={{
              backgroundColor: "rgba(255, 179, 217, 0.1)",
              borderColor: "var(--color-aurora-rosa)"
            }}
          >
            <p 
              className="text-sm font-medium mb-3"
              style={{ color: "var(--color-aurora-rosa)" }}
            >
              SoluciÃ³n alternativa ðŸ’¡
            </p>
            <button
              onClick={copyMessageToClipboard}
              className="w-full px-4 py-3 rounded-2xl font-medium transition-all duration-3000 hover:opacity-90 shadow-lg mb-2"
              style={{
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "white"
              }}
            >
              ðŸ“‹ Copiar mensaje y enviar manualmente
            </button>
            <p className="text-xs opacity-75" style={{ color: "var(--color-aurora-lavanda)" }}>
              ðŸ“± WhatsApp: +{whatsappNumber}
            </p>
          </div>
          
          {/* Botones principales */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <button 
              onClick={() => {
                // ðŸ“Š Track: Usuario cancelÃ³
                analytics.track('user_cancelled', {
                  strategy: whatsappStrategy || 'unknown',
                  errorMessage: whatsappError || 'unknown'
                });
                
                resetWhatsAppError();
              }}
              className="flex-1 px-6 py-3 rounded-2xl font-medium transition-all duration-3000 hover:opacity-80"
              style={{
                backgroundColor: "rgba(156, 163, 175, 0.8)",
                color: "white"
              }}
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                // ðŸ“Š Track: Usuario reintentÃ³
                analytics.track('retry_attempted', {
                  attemptNumber: attemptCount + 1,
                  strategy: whatsappStrategy || 'unknown',
                  errorMessage: whatsappError || 'unknown'
                });
                
                resetWhatsAppError();
                // Reintentar con la estrategia actual o la siguiente
                processConfirmation();
              }}
              className="flex-1 px-6 py-3 rounded-2xl font-medium transition-all duration-3000 hover:opacity-90 shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--color-aurora-rosa), var(--color-aurora-lavanda))",
                color: "white"
              }}
            >
              ðŸ”„ Reintentar
            </button>
          </div>

          {/* OpciÃ³n manual para desktop */}
          {!deviceInfo.isMobile && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Â¿Sigues teniendo problemas?</p>
              <button
                onClick={() => {
                  // ðŸ“Š Track: Usuario eligiÃ³ mÃ©todo manual
                  analytics.track('manual_fallback', {
                    strategy: 'manual_desktop',
                    userChoice: 'manual_copy'
                  });
                  
                  resetWhatsAppError();
                  copyMessageToClipboard();
                }}
                className="text-sm underline hover:no-underline transition-all"
                style={{ color: "var(--color-aurora-lavanda)" }}
              >
                Usar mÃ©todo manual
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-20 px-4"
    >
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src={attendance.backgroundVideo} type="video/mp4" />
      </video>

      

      {/* <BackgroundCarrousel images={attendance.images} /> */}

      

      <div className="max-w-2xl mx-auto relative bg-slate-300 bg-opacity-30 rounded-3xl" style={{ zIndex: 2 }}>
        <div
          className="rounded-3xl p-10 shadow-2xl border-2 relative overflow-hidden"
          
        >
          {/* Shimmer effect decorativo */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aurora-oro to-transparent animate-vip-shimmer-aurora opacity-60"></div>

          {/* Header con icono y tÃ­tulo */}
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-lg transition-all duration-1000 ${
                isVisible 
                  ? 'opacity-100 scale-100 animate-vip-pulse-aurora' 
                  : 'opacity-0 scale-50'
              }`}
              style={{
                background:
                  "linear-gradient(135deg, var(--color-aurora-rosa), var(--color-aurora-lavanda))",
                transitionDelay: '0ms'
              }}
            >
              <Heart className="w-10 h-10 text-white" />
            </div>

            <h3
              className={`text-4xl font-main-text font-bold mb-4 leading-tight transition-all duration-1000 delay-1000 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-8'
              }`}
              style={{
                color: '#DC143C'
              }}
            >
              Confirma tu Asistencia
            </h3>

            <p
              className={`text-xl text-blue-700 bg-slate-300 bg-opacity-60 rounded-2xl p-6 leading-relaxed max-w-lg mx-auto transition-all duration-1000 delay-1000 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-8'
              }`}
              //style={{ color: '#FFD700' }}
            >
              ¿Nos acompañaras en este día tan especial?
              <br />
              <span className="font-medium">
                Confirma tu asistencia y comparte este momento mágico
              </span>
            </p>
          </div>

          {/* Formulario mejorado */}
          <form onSubmit={handleConfirmAttendance} className="space-y-6">
            {/* Mensaje de Ã©xito */}
            {showSuccess && (
              <div
                className="text-center p-4 rounded-2xl mb-6 animate-pulse"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 179, 217, 0.2), rgba(230, 217, 255, 0.2))",
                  border: "2px solid var(--color-aurora-rosa)",
                }}
              >
                <div className="text-2xl mb-2">¡Confirmación Enviada!</div>
                <p style={{ color: "var(--color-aurora-lavanda)" }}>
                  WhatsApp se abrirá automáticamente con tu mensaje de
                  confirmación
                </p>
              </div>
            )}

            {/* Campo Nombre */}
            <div className={`relative group transition-all duration-1000 delay-2000 ${
              isVisible 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-12'
            }`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-aurora-lavanda opacity-70" />
              </div>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Tu nombre completo"
                required
                disabled={isWhatsAppLoading}
                className="w-full text-black pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-3000 focus:outline-none focus:ring-0 text-lg placeholder-opacity-60 disabled:opacity-50"
                style={{
                  background: "rgba(253, 252, 252, 0.8)",
                  borderColor: "rgba(255, 242, 204, 0.4)",
                  //color: "var(--color-aurora-lavanda)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-aurora-rosa)";
                  e.target.style.boxShadow =
                    "0 0 20px rgba(255, 179, 217, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 242, 204, 0.4)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Campo TelÃ©fono */}
            <div className={`relative group transition-all duration-1000 delay-3000 ${
              isVisible 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 translate-x-12'
            }`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-aurora-lavanda opacity-70" />
              </div>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Tu número de teléfono"
                disabled={isWhatsAppLoading}
                className="w-full text-black pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-3000 focus:outline-none focus:ring-0 text-lg placeholder-opacity-60 disabled:opacity-50"
                style={{
                  background: "rgba(253, 252, 252, 0.8)",
                  borderColor: "rgba(255, 242, 204, 0.4)",
                  //color: "var(--color-aurora-lavanda)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-aurora-rosa)";
                  e.target.style.boxShadow =
                    "0 0 20px rgba(255, 179, 217, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 242, 204, 0.4)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Campo ConfirmaciÃ³n de Asistencia */}
            <div className={`relative group transition-all duration-1000 delay-4000 ${
              isVisible 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-12'
            }`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <CheckCircle className="h-5 w-5 text-aurora-lavanda opacity-70" />
              </div>
              <select
                name="confirmacion"
                value={formData.confirmacion}
                onChange={handleInputChange}
                disabled={isWhatsAppLoading}
                className="w-full text-black pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-3000 focus:outline-none focus:ring-0 text-lg disabled:opacity-50 appearance-none cursor-pointer"
                style={{
                  background: "rgba(253, 252, 252, 0.8)",
                  borderColor: "rgba(255, 242, 204, 0.4)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-aurora-rosa)";
                  e.target.style.boxShadow =
                    "0 0 20px rgba(255, 179, 217, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 242, 204, 0.4)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="si">✅ Sí­, confirmo mi asistencia</option>
                <option value="no">❌ No podré asistir</option>
              </select>
            </div>

            {/* Campo NÃºmero de Invitados */}
            <div className={`relative group transition-all duration-1000 delay-5000 ${
              isVisible 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 translate-x-12'
            }`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-aurora-lavanda opacity-70" />
              </div>
              <select
                name="numeroInvitados"
                value={formData.numeroInvitados}
                onChange={handleInputChange}
                disabled={isWhatsAppLoading}
                className="w-full text-black pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-3000 focus:outline-none focus:ring-0 text-lg disabled:opacity-50 appearance-none cursor-pointer"
                style={{
                  background: "rgba(253, 252, 252, 0.8)",
                  borderColor: "rgba(255, 242, 204, 0.4)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-aurora-rosa)";
                  e.target.style.boxShadow =
                    "0 0 20px rgba(255, 179, 217, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 242, 204, 0.4)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value={1}>1 persona</option>
                <option value={2}>2 personas</option>
                <option value={3}>3 personas</option>
                <option value={4}>4 personas</option>
                <option value={5}>5 personas</option>
                <option value={6}>6 personas</option>
                <option value={7}>7 personas</option>
                <option value={8}>8 personas</option>
                <option value={9}>9 personas</option>
                <option value={10}>10 personas</option>

              </select>
            </div>

            {/* Campo Mensaje */}
            <div className={`relative group transition-all duration-1000 delay-6000 ${
              isVisible 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-12'
            }`}>
              <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                <MessageCircle className="h-5 w-5 text-aurora-lavanda opacity-70" />
              </div>
              <textarea
                name="mensaje"
                value={formData.mensaje}
                onChange={handleInputChange}
                placeholder="Mensaje especial (opcional)..."
                rows={4}
                disabled={isWhatsAppLoading}
                className="w-full text-black pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-3000 focus:outline-none focus:ring-0 text-lg placeholder-opacity-60 resize-none disabled:opacity-50"
                style={{
                  background: "rgba(253, 252, 252, 0.8)",
                  borderColor: "rgba(255, 242, 204, 0.4)",
                  //color: "var(--color-aurora-lavanda)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-aurora-rosa)";
                  e.target.style.boxShadow =
                    "0 0 20px rgba(255, 179, 217, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 242, 204, 0.4)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Componente de Feedback Avanzado */}
            <div className={`transition-all duration-1000 delay-6500 ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}>
              <WhatsAppFeedback
                isLoading={isWhatsAppLoading}
                isSuccess={showSuccess}
                strategy={currentStrategy}
                attempts={attemptCount}
                className="mb-4"
              />
              
              {/* Progreso detallado de estrategia */}
              <StrategyProgress
                currentStrategy={currentStrategy}
                isLoading={isWhatsAppLoading}
                attempts={attemptCount}
                className="mb-2"
              />
            </div>

            {/* BotÃ³n de confirmaciÃ³n mejorado */}
            <div className={`pt-4 text-center transition-all duration-1000 delay-7000 ${
              isVisible 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-75'
            }`}>
              <Button
                size="lg"
                type="submit"
                disabled={isWhatsAppLoading || showSuccess}
                className="relative overflow-hidden text-white rounded-full py-8 px-8 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500 text-lg font-semibold group min-w-[200px] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  background: showSuccess
                    ? "linear-gradient(135deg, #4ade80, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #aaa 0%, #bbb 50%, #ccc 100%)",
                  border: "2px solid rgba(255, 242, 204, 0.5)",
                }}
              >
                {/* Efecto shimmer en el botÃ³n */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-3000"></div>

                <div className="relative flex items-center justify-center">
                  {isWhatsAppLoading ? (
                    <>
                      <div className="flex items-center mr-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <div className="ml-2 animate-pulse">
                          {currentStrategy && (
                            <span className="text-xs opacity-75">
                              {currentStrategy === 'native' && 'native'}
                              {currentStrategy === 'web' && 'web'}
                              {currentStrategy === 'api' && 'api'}
                              {currentStrategy === 'manual' && 'manual'}
                            </span>
                          )}
                        </div>
                      </div>
                      <span>
                        {attemptCount > 1 
                          ? `Reintentando... (${attemptCount})`
                          : 'Preparando mensaje...'
                        }
                      </span>
                    </>
                  ) : showSuccess ? (
                    <>
                      <span className="text-2xl mr-2 animate-bounce">Mensaje</span>
                      <span>¡Enviado a WhatsApp!</span>
                      {currentStrategy && (
                        <span className="ml-2 text-sm opacity-75">
                          vía {currentStrategy}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                      <h6 className="flex flex-col md:flex-row gap-2 items-center justify-center" style={{ color: '#DC143C' }}>
                        <span>Confirmar</span>
                        <span>Asistencia</span>
                      </h6>
                    </>
                  )}
                </div>
              </Button>

              {/* Texto informativo debajo del botÃ³n */}
              <p className={`mt-4 text-sm opacity-75 text-blue-700 bg-emerald-200 bg-opacity-50 p-4 rounded-xl transition-all duration-1000 delay-8000 ${
                isVisible 
                  ? 'opacity-75 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}>
                {showSuccess
                  ? "¡Gracias por confirmar! Te esperamos en esta celebración especial"
                  : "Al confirmar, recibirás todos los detalles por WhatsApp"}
              </p>
            </div>
          </form>
        </div>
      </div>
      
      {/* Modal para Pop-up Blocker */}
      {whatsappError && <IntelligentErrorModal />}
      
      {/* Dashboard de Analytics (solo desarrollo) - TEMPORALMENTE DESHABILITADO */}
      {/* <AnalyticsDashboard /> */}
      
      {/* Estilos CSS para el componente de feedback */}
      <WhatsAppFeedbackStyles />
    </section>
  );
};

export default AttendanceConfirmation;
