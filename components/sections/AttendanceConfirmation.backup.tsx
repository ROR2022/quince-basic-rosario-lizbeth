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
  
  // 🎯 Estados para retroalimentación avanzada
  const [attemptCount, setAttemptCount] = useState(0);
  const [currentStrategy, setCurrentStrategy] = useState<string | undefined>(undefined);

  // 📊 Hook de Analytics
  const analytics = useWhatsAppAnalytics();

  // 🆕 Nuevo hook de WhatsApp
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
      console.log('✅ WhatsApp enviado exitosamente:', result);
      setShowSuccess(true);
      resetWhatsAppError(); // Limpiar errores en éxito
      
      // 🎯 Reiniciar contadores de feedback
      setAttemptCount(0);
      setCurrentStrategy(result.strategy);
      
      // Limpiar formulario después de éxito
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
      console.error('❌ Error al enviar WhatsApp:', error);
      
      // Si la estrategia manual fue exitosa, no mostrar como error
      if (result?.strategy === 'manual' && result?.success) {
        setShowSuccess(true);
        resetWhatsAppError(); // Limpiar errores para estrategia manual exitosa
        return;
      }
      
      // Para otros errores, el hook ya maneja whatsappError automáticamente
    },
    autoReset: true,
    resetDelay: 5000
  });

  const { attendance, event } = quinceMainData;
  const parents = event.parents;

  // Número de WhatsApp de destino (ahora viene del hook)
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

  // Función mejorada para detectar si los pop-ups están bloqueados
  const checkPopupBlocked = async () => {
    try {
      // Método más robusto de detección
      const popup = window.open('', 'test', 'width=1,height=1,left=0,top=0');
      
      if (!popup) {
        return true; // Definitivamente bloqueado
      }

      // Verificar si el popup realmente se abrió
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const isBlocked = popup.closed || popup.innerWidth === undefined;
      
      // Cerrar el popup de prueba
      if (!popup.closed) {
        popup.close();
      }
      
      return isBlocked;
    } catch (error) {
      console.log('🚫 Error en detección de pop-ups:', error);
      return true; // En caso de error, asumir que están bloqueados
    }
  };

  // Función para detectar dispositivo y navegador
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

  // Función para obtener instrucciones específicas por navegador y dispositivo
  const getBrowserInstructions = () => {
    const deviceInfo = getDeviceAndBrowserInfo();
    
    // Instrucciones para dispositivos móviles
    if (deviceInfo.isMobile) {
      if (deviceInfo.isIOS) {
        return {
          title: "📱 iPhone/iPad",
          steps: [
            "1. Ve a Configuración de tu iPhone",
            "2. Busca y toca 'Safari'", 
            "3. Desactiva 'Bloquear ventanas emergentes'",
            "4. Regresa aquí y confirma de nuevo"
          ],
          showAlternative: true
        };
      }
      
      if (deviceInfo.isAndroid) {
        return {
          title: "📱 Android",
          steps: [
            "1. Toca los 3 puntos ⋮ (esquina superior)",
            "2. Configuración → Configuración de sitios",
            "3. 'Ventanas emergentes' → Permitir",
            "4. Regresa y confirma de nuevo"
          ],
          showAlternative: true
        };
      }
      
      // Móvil genérico
      return {
        title: "📱 Teléfono móvil",
        steps: [
          "1. Busca el menú de configuración del navegador",
          "2. Encuentra 'Pop-ups' o 'Ventanas emergentes'",
          "3. Permítelos para este sitio",
          "4. Regresa e intenta de nuevo"
        ],
        showAlternative: true
      };
    }
    
    // Instrucciones para escritorio (mantenemos las originales)
    if (deviceInfo.userAgent.includes('Chrome')) {
      return {
        title: "🖥️ Chrome",
        steps: [
          "1. Busca el ícono 🚫 en la barra de direcciones",
          "2. Haz clic en él y selecciona 'Permitir pop-ups'"
        ],
        showAlternative: false
      };
    }
    
    if (deviceInfo.userAgent.includes('Firefox')) {
      return {
        title: "🖥️ Firefox", 
        steps: [
          "1. Busca el escudo 🛡️ junto a la dirección",
          "2. Clic → Desactivar 'Bloquear ventanas emergentes'"
        ],
        showAlternative: false
      };
    }
    
    if (deviceInfo.userAgent.includes('Safari')) {
      return {
        title: "🖥️ Safari",
        steps: [
          "1. Safari → Preferencias → Sitios web",
          "2. Ventanas emergentes → Permitir para este sitio"
        ],
        showAlternative: false
      };
    }
    
    if (deviceInfo.userAgent.includes('Edge')) {
      return {
        title: "🖥️ Edge",
        steps: [
          "1. Busca el ícono 🚫 en la barra de direcciones",
          "2. Clic → 'Permitir ventanas emergentes'"
        ],
        showAlternative: false
      };
    }
    
    // Fallback genérico
    return {
      title: "🌐 Navegador",
      steps: [
        "Busca el ícono de pop-ups bloqueados en tu navegador",
        "y permítelos para este sitio"
      ],
      showAlternative: deviceInfo.isMobile
    };
  };

  // Función para construir mensaje corto (fallback)
  const buildShortMessage = () => {
    const confirmacionTexto = formData.confirmacion === "si" ? "Asistiré" : "No asistiré";
    return `Confirmación XV años Ximena: ${formData.nombre} - ${confirmacionTexto} - ${formData.numeroInvitados} persona(s)`;
  };

  // Función para construir mensaje completo
  const buildFullMessage = () => {
    const confirmacionTexto =
      formData.confirmacion === "si"
        ? "✅ ¡Confirmo mi asistencia!"
        : "❌ No podré asistir";

    const invitadosTexto =
      formData.numeroInvitados === 1
        ? "1 persona"
        : `${formData.numeroInvitados} personas`;

    return `🎉 *CONFIRMACIÓN DE ASISTENCIA* 🎉

👤 *Nombre:* ${formData.nombre}
${formData.telefono ? `📱 *Teléfono:* ${formData.telefono}` : ""}

${confirmacionTexto}
👥 *Número de invitados:* ${invitadosTexto}

${formData.mensaje ? `💌 *Mensaje especial:*\n${formData.mensaje}` : ""}

¡Gracias por responder! 💖✨`;
  };

  // Función para validar longitud de URL
  const validateUrlLength = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const testUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    const MAX_URL_LENGTH = 2000; // Límite conservador para URLs
    
    return {
      isValid: testUrl.length <= MAX_URL_LENGTH,
      urlLength: testUrl.length,
      messageLength: message.length
    };
  };

  // 🎯 Función principal de procesamiento de confirmación
  const processConfirmation = async () => {
    // Validación simple
    if (!formData.nombre.trim()) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    try {
      // 📊 Actualizar feedback de intento y estrategia
      setAttemptCount(prev => prev + 1);
      setCurrentStrategy(whatsappStrategy || 'auto');
      
      // 🆕 Usar el nuevo hook para enviar mensaje
      const messageData: MessageData = {
        name: formData.nombre.trim(),
        phone: formData.telefono?.trim() || undefined,
        attendance: formData.confirmacion as 'si' | 'no',
        guests: formData.numeroInvitados,
        comments: formData.mensaje?.trim() || undefined
      };

      console.log('🎯 Enviando confirmación con nuevo sistema:', messageData);

      // 🎯 NUEVA FUNCIONALIDAD: Llamar al endpoint de confirmación automática
      const confirmationData = {
        name: formData.nombre.trim(),
        numberOfGuests: formData.numeroInvitados,
        willAttend: formData.confirmacion === "si",
        comments: formData.mensaje?.trim() || undefined,
        phone: formData.telefono?.trim() || undefined,
      };

      console.log("🎯 Enviando confirmación automática...", confirmationData);

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
        console.log("🎯 Confirmación procesada exitosamente:", {
          action: result.action,
          guest: result.guest.name,
          similarity: result.matchInfo?.similarity,
          matchType: result.matchInfo?.matchType,
          willAttend: confirmationData.willAttend,
          numberOfGuests: confirmationData.numberOfGuests,
        });

        if (result.action === "updated") {
          const matchMethod =
            result.matchInfo?.matchMethod === "phone" ? "teléfono" : "nombre";
          const conflictInfo = result.matchInfo?.hasConflict
            ? " (⚠️ números diferentes)"
            : "";
          console.log(
            `✅ Invitado actualizado por ${matchMethod}: "${
              result.guest.name
            }" (${result.matchInfo?.similarity?.toFixed(
              1
            )}% similitud)${conflictInfo}`
          );

          if (result.matchInfo?.hasConflict) {
            console.log(
              `⚠️ Se detectó un conflicto de teléfono - verificar manualmente`
            );
          }
        } else if (result.action === "created") {
          console.log(`🆕 Nuevo invitado creado: "${result.guest.name}"`);
          if (result.matchInfo?.multipleMatches) {
            console.log(
              `⚠️ Búsqueda ambigua: ${result.matchInfo.matchesCount} coincidencias similares encontradas`
            );
          }
        }
      } else {
        console.error("❌ Error en confirmación automática:", result.message);
      }

      // 🆕 Enviar mensaje de WhatsApp usando el nuevo sistema
      await sendMessage(messageData);

    } catch (error) {
      console.error("❌ Error procesando confirmación automática:", error);
      // El hook maneja los errores automáticamente
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
      console.log(`⚠️ Mensaje muy largo (${validation.urlLength} chars), usando versión corta`);
      mensaje = buildShortMessage();
      validation = validateUrlLength(mensaje);
    }

    console.log('� Mensaje seleccionado:', {
      type: mensaje === buildFullMessage() ? 'completo' : 'corto',
      messageLength: validation.messageLength,
      urlLength: validation.urlLength,
      isValid: validation.isValid
    });

    try {
      await navigator.clipboard.writeText(mensaje);
      
      // 📊 Track: Copia exitosa
      analytics.track('manual_fallback', {
        strategy: 'clipboard_copy',
        messageLength: validation.messageLength,
        userChoice: 'copy_to_clipboard'
      });
      
      alert(`✅ ¡Mensaje copiado! Ahora abre WhatsApp y envíalo a:\n+${whatsappNumber}`);
      resetWhatsAppError(); // Limpiar errores después de copiar
      
      // Procesar confirmación automática en backend
      processConfirmation();
    } catch (error) {
      // 📊 Track: Fallback a prompt
      analytics.track('manual_fallback', {
        strategy: 'prompt_fallback',
        messageLength: validation.messageLength,
        userChoice: 'manual_prompt'
      });
      
      // Fallback si no funciona clipboard API
      prompt("Copia este mensaje y envíalo por WhatsApp:", mensaje);
      resetWhatsAppError(); // Limpiar errores después de copiar
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

    // 📊 Track: Envío de formulario
    analytics.track('form_submitted', {
      formData: {
        nombre: formData.nombre,
        telefono: formData.telefono,
        numeroInvitados: formData.numeroInvitados,
        confirmacion: formData.confirmacion
      }
    });

    // 🆕 El nuevo hook maneja toda la lógica de detección y fallbacks
    await processConfirmation();
  };

  const processConfirmation = async () => {
    // Validación simple
    if (!formData.nombre.trim()) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    try {
      // � Actualizar feedback de intento y estrategia
      setAttemptCount(prev => prev + 1);
      setCurrentStrategy(whatsappStrategy || 'auto');
      
      // �🆕 Usar el nuevo hook para enviar mensaje
      const messageData: MessageData = {
        name: formData.nombre.trim(),
        phone: formData.telefono?.trim() || undefined,
        attendance: formData.confirmacion as 'si' | 'no',
        guests: formData.numeroInvitados,
        comments: formData.mensaje?.trim() || undefined
      };

      console.log('🎯 Enviando confirmación con nuevo sistema:', messageData);

      // 🎯 NUEVA FUNCIONALIDAD: Llamar al endpoint de confirmación automática
      const confirmationData = {
        name: formData.nombre.trim(),
        numberOfGuests: formData.numeroInvitados,
        willAttend: formData.confirmacion === "si",
        comments: formData.mensaje?.trim() || undefined,
        phone: formData.telefono?.trim() || undefined,
      };

      console.log("🎯 Enviando confirmación automática...", confirmationData);

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
        console.log("🎯 Confirmación procesada exitosamente:", {
          action: result.action,
          guest: result.guest.name,
          similarity: result.matchInfo?.similarity,
          matchType: result.matchInfo?.matchType,
          willAttend: confirmationData.willAttend,
          numberOfGuests: confirmationData.numberOfGuests,
        });

        if (result.action === "updated") {
          const matchMethod =
            result.matchInfo?.matchMethod === "phone" ? "teléfono" : "nombre";
          const conflictInfo = result.matchInfo?.hasConflict
            ? " (⚠️ números diferentes)"
            : "";
          console.log(
            `✅ Invitado actualizado por ${matchMethod}: "${
              result.guest.name
            }" (${result.matchInfo?.similarity?.toFixed(
              1
            )}% similitud)${conflictInfo}`
          );

          if (result.matchInfo?.hasConflict) {
            console.log(
              `⚠️ Se detectó un conflicto de teléfono - verificar manualmente`
            );
          }
        } else if (result.action === "created") {
          console.log(`🆕 Nuevo invitado creado: "${result.guest.name}"`);
          if (result.matchInfo?.multipleMatches) {
            console.log(
              `⚠️ Búsqueda ambigua: ${result.matchInfo.matchesCount} coincidencias similares encontradas`
            );
          }
        }
      } else {
        console.error("❌ Error en confirmación automática:", result.message);
      }

      // 🆕 Enviar mensaje de WhatsApp usando el nuevo sistema
      await sendMessage(messageData);

    } catch (error) {
      console.error("❌ Error procesando confirmación automática:", error);
      // El hook maneja los errores automáticamente
    }
  };

  // Componente Modal Inteligente para Errores de WhatsApp
  const IntelligentErrorModal = () => {
    const instructions = getBrowserInstructions();
    const deviceInfo = getDeviceAndBrowserInfo();
    
    // Simplificado: usamos whatsappError como string
    const errorMessage = whatsappError || 'Error desconocido';
    const isPopupError = errorMessage.toLowerCase().includes('popup') || errorMessage.toLowerCase().includes('bloqueado');
    
    // 📊 Track: Modal de error mostrado
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
      if (isPopupError) return '🚫➡️📱';
      if (errorMessage.toLowerCase().includes('dispositivo')) return '📱⚠️';
      if (errorMessage.toLowerCase().includes('conexión') || errorMessage.toLowerCase().includes('red')) return '📶❌';
      if (errorMessage.toLowerCase().includes('validación')) return '📝❌';
      return '❌🔧';
    };

    const getErrorTitle = () => {
      if (isPopupError) return 'Pop-ups Bloqueados';
      if (errorMessage.toLowerCase().includes('dispositivo')) return 'Dispositivo no Compatible';
      if (errorMessage.toLowerCase().includes('conexión') || errorMessage.toLowerCase().includes('red')) return 'Error de Conexión';
      if (errorMessage.toLowerCase().includes('validación')) return 'Error de Validación';
      return 'Error de WhatsApp';
    };

    const getErrorDescription = () => {
      if (isPopupError) return 'Para abrir WhatsApp automáticamente:';
      if (errorMessage.toLowerCase().includes('dispositivo')) return 'Tu dispositivo necesita una configuración especial:';
      if (errorMessage.toLowerCase().includes('conexión') || errorMessage.toLowerCase().includes('red')) return 'Hubo un problema de conexión:';
      if (errorMessage.toLowerCase().includes('validación')) return 'Revisa los datos ingresados:';
      return 'Se encontró un problema:';
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
          {/* Ícono dinámico */}
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
          
          {/* Mensaje de error específico */}
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
          
          {/* Instrucciones específicas para pop-ups */}
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
              Solución alternativa 💡
            </p>
            <button
              onClick={copyMessageToClipboard}
              className="w-full px-4 py-3 rounded-2xl font-medium transition-all duration-3000 hover:opacity-90 shadow-lg mb-2"
              style={{
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "white"
              }}
            >
              📋 Copiar mensaje y enviar manualmente
            </button>
            <p className="text-xs opacity-75" style={{ color: "var(--color-aurora-lavanda)" }}>
              📱 WhatsApp: +{whatsappNumber}
            </p>
          </div>
          
          {/* Botones principales */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <button 
              onClick={() => {
                // 📊 Track: Usuario canceló
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
                // 📊 Track: Usuario reintentó
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
              🔄 Reintentar
            </button>
          </div>

          {/* Opción manual para desktop */}
          {!deviceInfo.isMobile && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">¿Sigues teniendo problemas?</p>
              <button
                onClick={() => {
                  // 📊 Track: Usuario eligió método manual
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
                Usar método manual
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
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url('${parents.backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
      className="relative py-20 px-4"
    >

      {/* <BackgroundCarrousel images={attendance.images} /> */}

      

      <div className="max-w-2xl mx-auto relative bg-slate-300 bg-opacity-30 rounded-3xl">
        <div
          className="rounded-3xl p-10 shadow-2xl border-2 relative overflow-hidden"
          
        >
          {/* Shimmer effect decorativo */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aurora-oro to-transparent animate-vip-shimmer-aurora opacity-60"></div>

          {/* Header con icono y título */}
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
              className={`text-4xl font-main-text font-bold mb-4 leading-tight text-purple-500 transition-all duration-1000 delay-1000 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-8'
              }`}
              style={{
                background:
                  "linear-gradient(135deg, var(--color-aurora-lavanda), var(--color-aurora-rosa))",
                WebkitBackgroundClip: "text",
                //WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              💌 Confirma tu Asistencia
            </h3>

            <p
              className={`text-xl text-amber-900 bg-slate-300 bg-opacity-60 rounded-2xl p-6 leading-relaxed max-w-lg mx-auto transition-all duration-1000 delay-1000 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-8'
              }`}
            
            >
              ¿Nos acompañarás en este día tan especial?
              <br />
              <span className="font-medium">
                Confirma tu asistencia y comparte este momento único
              </span>
            </p>
          </div>

          {/* Formulario mejorado */}
          <form onSubmit={handleConfirmAttendance} className="space-y-6">
            {/* Mensaje de éxito */}
            {showSuccess && (
              <div
                className="text-center p-4 rounded-2xl mb-6 animate-pulse"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 179, 217, 0.2), rgba(230, 217, 255, 0.2))",
                  border: "2px solid var(--color-aurora-rosa)",
                }}
              >
                <div className="text-2xl mb-2">✅ ¡Confirmación Enviada!</div>
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

            {/* Campo Teléfono */}
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

            {/* Campo Confirmación de Asistencia */}
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
                <option value="si">✅ Sí, confirmo mi asistencia</option>
                <option value="no">❌ No podré asistir</option>
              </select>
            </div>

            {/* Campo Número de Invitados */}
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

            {/* Botón de confirmación mejorado */}
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
                {/* Efecto shimmer en el botón */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-3000"></div>

                <div className="relative flex items-center justify-center">
                  {isWhatsAppLoading ? (
                    <>
                      <div className="flex items-center mr-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <div className="ml-2 animate-pulse">
                          {currentStrategy && (
                            <span className="text-xs opacity-75">
                              {currentStrategy === 'native' && '📱'}
                              {currentStrategy === 'web' && '🌐'}
                              {currentStrategy === 'api' && '⚡'}
                              {currentStrategy === 'manual' && '📋'}
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
                      <span className="text-2xl mr-2 animate-bounce">✅</span>
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
                      <h6 className="text-purple-700 flex flex-col md:flex-row gap-2 items-center justify-center">
                        <span>✨ Confirmar</span>
                        <span>Asistencia</span>
                      </h6>
                    </>
                  )}
                </div>
              </Button>

              {/* Texto informativo debajo del botón */}
              <p className={`mt-4 text-sm opacity-75 text-pink-500 bg-emerald-200 bg-opacity-50 p-4 rounded-xl transition-all duration-1000 delay-8000 ${
                isVisible 
                  ? 'opacity-75 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}>
                {showSuccess
                  ? "¡Gracias por confirmar! Te esperamos en esta celebración especial 🎉"
                  : "Al confirmar, recibirás todos los detalles por WhatsApp 💌"}
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
