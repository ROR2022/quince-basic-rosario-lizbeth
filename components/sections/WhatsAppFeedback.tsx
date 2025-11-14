import React from 'react';

interface WhatsAppFeedbackProps {
  isLoading: boolean;
  isSuccess: boolean;
  strategy?: string;
  attempts?: number;
  className?: string;
}

export const WhatsAppFeedback: React.FC<WhatsAppFeedbackProps> = ({
  isLoading,
  isSuccess,
  strategy,
  attempts = 1,
  className = ''
}) => {
  if (!isLoading && !isSuccess) return null;

  return (
    <div className={`transition-all duration-500 ${className}`}>
      {isLoading && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed animate-pulse"
             style={{
               backgroundColor: "rgba(255, 179, 217, 0.1)",
               borderColor: "var(--color-aurora-rosa)"
             }}>
          {/* Spinner de carga personalizado */}
          <div className="relative">
            <div className="w-6 h-6 border-3 border-aurora-rosa border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-6 h-6 border-3 border-aurora-lavanda border-b-transparent rounded-full animate-spin" 
                 style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-sm" style={{ color: "var(--color-aurora-lavanda)" }}>
              {attempts > 1 ? `Reintentando... (${attempts}° intento)` : 'Abriendo WhatsApp...'}
            </p>
            {strategy && (
              <p className="text-xs opacity-75" style={{ color: "var(--color-aurora-rosa)" }}>
                Estrategia: {getStrategyDisplayName(strategy)}
              </p>
            )}
          </div>
          
          {/* Indicador de progreso animado */}
          <div className="text-xl animate-bounce">📱</div>
        </div>
      )}

      {isSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border-2 animate-fadeInScale"
             style={{
               backgroundColor: "rgba(16, 185, 129, 0.1)",
               borderColor: "rgba(16, 185, 129, 0.3)",
               animation: 'fadeInScale 0.6s ease-out'
             }}>
          {/* Checkmark animado */}
          <div className="relative">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-scaleIn">
              <div className="text-white text-sm font-bold animate-checkmark">✓</div>
            </div>
            {/* Círculos de éxito expandiéndose */}
            <div className="absolute inset-0 w-6 h-6 bg-green-400 rounded-full animate-ping opacity-30"></div>
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-sm text-green-700">
              ¡Confirmación enviada exitosamente! 🎉
            </p>
            {strategy && (
              <p className="text-xs text-green-600 opacity-75">
                Método: {getStrategyDisplayName(strategy)}
              </p>
            )}
          </div>
          
          {/* Emoji celebratorio */}
          <div className="text-xl animate-bounce" style={{ animationDelay: '0.3s' }}>
            🎊
          </div>
        </div>
      )}
    </div>
  );
};

// Función helper para nombres de estrategia más amigables
function getStrategyDisplayName(strategy: string): string {
  const strategyNames: Record<string, string> = {
    'native': 'App Nativo',
    'web': 'WhatsApp Web',
    'api': 'API Directa',
    'manual': 'Copia Manual',
    'fallback': 'Método Alternativo'
  };
  
  return strategyNames[strategy] || strategy;
}

// Agregar estilos CSS personalizados para las animaciones
export const WhatsAppFeedbackStyles = () => (
  <style jsx>{`
    @keyframes fadeInScale {
      0% {
        opacity: 0;
        transform: scale(0.9) translateY(10px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    @keyframes scaleIn {
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
      }
    }
    
    @keyframes checkmark {
      0% {
        opacity: 0;
        transform: scale(0);
      }
      50% {
        opacity: 0;
        transform: scale(0);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .animate-fadeInScale {
      animation: fadeInScale 0.6s ease-out;
    }
    
    .animate-scaleIn {
      animation: scaleIn 0.6s ease-out;
    }
    
    .animate-checkmark {
      animation: checkmark 0.8s ease-out;
    }
    
    .border-3 {
      border-width: 3px;
    }
  `}</style>
);