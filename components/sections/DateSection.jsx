// 📅 DateSection - Sección de fecha y countdown

import React, {useState, useEffect, useRef, useCallback} from 'react'
import CountdownTimer from '../countdown-timer'
//import { getOverlayStyle } from '@/utils/overlay'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { getAnimationConfig } from '@/data/animationConfig'
//import Image from 'next/image'
import { quinceMainData } from '@/components/sections/data/main-data'
import BackgroundCarrousel from './BackgroundCarrousel'

export default function DateSection() {
  //const { wedding, messages } = weddingData
  //const { dateSection } = styling
  const { event } = quinceMainData;
  //const { message } = event;
  const { parents, ceremony, date } = event;
  const sectionRef = useRef(null);
  
  // Estados para animaciones escalonadas cósmicas
  const [isInView, setIsInView] = useState(false);
  const [titleVisible, setTitleVisible] = useState(true); // Cambiado a true para visibilidad inmediata
  const [cardVisible, setCardVisible] = useState(true);   // Cambiado a true para visibilidad inmediata
  const [countdownVisible, setCountdownVisible] = useState(false);
  

  // Hook personalizado para IntersectionObserver
  const useIntersectionObserver = useCallback(() => {
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Secuencia cósmica escalonada
            setTimeout(() => setTitleVisible(true), 200);
            setTimeout(() => setCardVisible(true), 600);
            setTimeout(() => setCountdownVisible(true), 1000);
          } else {
            // Reset cuando sale de vista
            setIsInView(false);
            setTitleVisible(false);
            setCardVisible(false);
            setCountdownVisible(false);
          }
        },
        {
          threshold: 0.2,
          rootMargin: '-30px 0px'
        }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => observer.disconnect();
    }, []);
  }, []);

  useIntersectionObserver();

  // Función helper para clases de animación cósmica
  const getCosmicAnimationClass = (isVisible, animationType, delay = '') => {
    // Simplificado temporalmente para debugging
    return isVisible ? `animate-${animationType} ${delay}` : '';
  };
      
  const basicClass="text-8xl font-bold text-red-600 mb-2";
  const completeClass="text-8xl font-bold text-red-600 mb-2 animate-number-pulse";
    

  // Configurar animación de scroll con fallback de carga inmediata
  const animationConfig = getAnimationConfig('date')
  // Ya no necesitamos el hook useScrollAnimation, usamos nuestro IntersectionObserver

  return (
    <section 
      ref={sectionRef}
      id="date" 
      className={`py-20 relative ${isInView ? 'animate-time-warp' : ''}`}
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
        <source src={date.backgroundVideo} type="video/mp4" />
      </video>

     

      {/* <BackgroundCarrousel images={date.backgroundCarrouselImages || []} /> */}
      {/* Elementos temporales/cósmicos orbitales */}
      <div className="temporal-element top-16 left-16 animate-orbital-float delay-200" style={{ zIndex: 2 }}>
        <span className="text-3xl clock-icon animate-clock-tick">🕒</span>
      </div>
      <div className="temporal-element top-24 right-20 animate-orbital-float delay-500" style={{animationDirection: 'reverse', zIndex: 2 }}>
        <span className="text-2xl cosmic-star animate-star-shimmer delay-300">⭐</span>
      </div>
      <div className="temporal-element bottom-20 left-24 animate-orbital-float delay-800" style={{ zIndex: 2 }}>
        <span className="text-2xl clock-icon animate-clock-tick delay-400">⌚</span>
      </div>
      <div className="temporal-element bottom-16 right-16 animate-orbital-float delay-1000" style={{animationDirection: 'reverse', zIndex: 2 }}>
        <span className="text-3xl cosmic-star animate-star-shimmer delay-600">🌟</span>
      </div>

      {/* Partículas temporales flotantes */}
      {Array.from({length: 8}).map((_, i) => (
        <div 
          key={i}
          className="time-particle animate-time-particle"
          style={{
            left: `${10 + i * 12}%`,
            animationDelay: `${i * 1.2}s`,
            zIndex: 2
          }}
        />
      ))}

      <div className="container text-white rounded-b-2xl mx-auto px-4 p-6 rounded-2xl relative z-10" style={{ zIndex: 3 }}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Mensaje inicial con animación cósmica */}
          <div className={getCosmicAnimationClass(titleVisible, 'cosmic-fade-in', 'delay-100')}>
            <p className="text-lg text-rose-900 italic font-bold">
              {date.mensaje1}
            </p>
          </div>

          {/* Título holográfico */}
          <div className={getCosmicAnimationClass(titleVisible, 'cosmic-fade-in', 'delay-200')}>
            <h2 
              style={{
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                //color: '#FFD700' // Dorado
              }}
              className="font-main-text text-4xl font-bold text-blue-700"
            >
              FECHA ESPECIAL
            </h2>
          </div>

          {/* Card principal cósmica/holográfica */}
          <div className={getCosmicAnimationClass(cardVisible, 'calendar-flip', 'delay-300')}>
            <div 
              className="rounded-3xl p-12 max-w-md mx-auto relative overflow-hidden bg-sky-400 bg-opacity-50"
              style={{
                minHeight: '300px',
                //backgroundColor: 'rgba(192, 192, 192, 0.15)', // Plata/Silver con transparencia
                border: '2px solid rgba(255, 215, 0, 0.6)', // Borde dorado
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)', // Resplandor dorado
                display: 'block'
              }}
            >
              
              {/* Contenido de la card */}
              <div className="relative z-20">
                <div 
                  className="text-2xl font-medium mb-2 text-glow text-rose-900"
                  //style={{ color: '#C0C0C0' }} // Plata
                >
                  {date.day ? date.day.toUpperCase() : 'SÁBADO'}
                </div>
                
                <div className='flex justify-center gap-3'>
                  <div className={cardVisible ? completeClass : basicClass}>
                    {date.dayNumber || '27'}
                  </div>
                </div>
                
                <div 
                  className="text-2xl font-medium mb-2 text-glow text-rose-900"
                  //style={{ color: '#C0C0C0' }} // Plata
                >
                  {date.month ? date.month.toUpperCase() : 'DICIEMBRE'}
                </div>
                <div 
                  className="text-3xl font-medium holographic-text"
                  style={{ color: '#FFD700' }} // Dorado
                >
                  {date.year || '2025'}
                </div>
              </div>

              {/* Borde rotativo - Movido después del contenido para que no lo tape */}
              <div 
                className="absolute inset-0 rounded-3xl p-1 animate-rotating-border -z-10"
                style={{
                  background: 'linear-gradient(45deg, #DC143C, #FFD700, #C0C0C0, #DC143C)', // Rojo, Dorado, Plata
                  backgroundSize: '300% 300%'
                }}
              >
                <div className="w-full h-full bg-black/20 rounded-3xl"></div>
              </div>

              {/* Elementos decorativos internos de la card */}
              <div className="absolute top-4 left-4 text-lg opacity-70 animate-clock-tick z-10">⏰</div>
              <div className="absolute top-4 right-4 text-lg opacity-70 animate-star-shimmer z-10">✨</div>
              <div className="absolute bottom-4 left-4 text-lg opacity-70 animate-star-shimmer delay-500 z-10">💫</div>
              <div className="absolute bottom-4 right-4 text-lg opacity-70 animate-clock-tick delay-300 z-10">🕐</div>
            </div>
          </div>

          {/* Mensaje final */}
          <div className={getCosmicAnimationClass(cardVisible, 'cosmic-fade-in', 'delay-500')}>
            <h3 
              className="font-script text-3xl text-blue-700 font-bold"
              //style={{ color: '#FFD700' }} // Dorado
            >
              {date.mensaje2}
            </h3>
          </div>

          {/* Countdown con animación */}
          <div className={getCosmicAnimationClass(countdownVisible, 'cosmic-fade-in', 'delay-700')}>
            <CountdownTimer />
          </div>
        </div>
      </div>
    </section>
  )
}
