import React from 'react';

interface StrategyProgressProps {
  currentStrategy?: string;
  isLoading: boolean;
  attempts: number;
  className?: string;
}

export const StrategyProgress: React.FC<StrategyProgressProps> = ({
  currentStrategy,
  isLoading,
  attempts,
  className = ''
}) => {
  if (!isLoading || !currentStrategy) return null;

  const strategies = [
    { key: 'native', name: 'App Nativo', icon: '📱', desc: 'Abriendo WhatsApp directamente' },
    { key: 'web', name: 'Web', icon: '🌐', desc: 'Usando WhatsApp Web' },
    { key: 'api', name: 'API', icon: '⚡', desc: 'Conexión directa' },
    { key: 'manual', name: 'Manual', icon: '📋', desc: 'Copia manual del mensaje' }
  ];

  const currentIndex = strategies.findIndex(s => s.key === currentStrategy);
  const current = strategies[currentIndex] || strategies[0];

  return (
    <div className={`text-center py-2 ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        {/* Indicador de estrategia actual */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
             style={{
               backgroundColor: "rgba(255, 179, 217, 0.2)",
               color: "var(--color-aurora-lavanda)"
             }}>
          <span className="animate-pulse">{current.icon}</span>
          <span className="font-medium">{current.name}</span>
          {attempts > 1 && (
            <span className="ml-1 opacity-75">
              (Intento {attempts})
            </span>
          )}
        </div>
      </div>
      
      {/* Descripción de la estrategia */}
      <p className="text-xs opacity-75 animate-pulse"
         style={{ color: "var(--color-aurora-rosa)" }}>
        {current.desc}
      </p>
      
      {/* Barra de progreso animada */}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
        <div 
          className="h-full rounded-full animate-pulse"
          style={{
            background: "linear-gradient(90deg, var(--color-aurora-rosa), var(--color-aurora-lavanda))",
            width: '100%',
            animation: 'loading-bar 2s ease-in-out infinite'
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};