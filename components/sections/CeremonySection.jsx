// ⛪ CeremonySection - Sección de información de la ceremonia

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { MapPin, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { quinceMainData } from "./data/main-data";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { getAnimationConfig } from "@/data/animationConfig";

export default function CeremonySection() {
  
  const { parents, ceremony, party } = quinceMainData.event;
  const sectionRef = useRef(null);
  
  // Estados para animaciones teatrales escalonadas
  const [isInView, setIsInView] = useState(false);
  const [curtainVisible, setCurtainVisible] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);
  const [ceremonyCardVisible, setCeremonyCardVisible] = useState(false);
  const [partyCardVisible, setPartyCardVisible] = useState(false);

  // Hook personalizado para IntersectionObserver
  const useIntersectionObserver = useCallback(() => {
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Secuencia teatral escalonada
            setTimeout(() => setCurtainVisible(true), 200);
            setTimeout(() => setImageVisible(true), 600);
            setTimeout(() => setCeremonyCardVisible(true), 1000);
            setTimeout(() => setPartyCardVisible(true), 1400);
          } else {
            // Reset cuando sale de vista
            setIsInView(false);
            setCurtainVisible(false);
            setImageVisible(false);
            setCeremonyCardVisible(false);
            setPartyCardVisible(false);
          }
        },
        {
          threshold: 0.3,
          rootMargin: '-50px 0px'
        }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => observer.disconnect();
    }, []);
  }, []);

  useIntersectionObserver();

  // Función helper para clases de animación elegante
  const getElegantAnimationClass = (isVisible, animationType, delay = '') => {
    return isVisible ? `animate-${animationType} ${delay}` : '';
  };

  const basicClass = "text-2xl font-bold text-rose-900";
  const completeClass = "text-2xl font-bold text-rose-900 animate-elegant-float";

  // Configurar animación de scroll
  const animationConfig = getAnimationConfig("ceremony");
  // Ya no necesitamos el hook useScrollAnimation, usamos nuestro IntersectionObserver

  return (
    <section
      ref={sectionRef}
      id="ceremony"
      className="py-20 relative overflow-hidden"
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
        <source src={ceremony.backgroundVideo} type="video/mp4" />
      </video>

    

      {/* Cortina teatral de entrada */}
      <div className={getElegantAnimationClass(curtainVisible, 'curtain-reveal', 'delay-200')} style={{ position: 'relative', zIndex: 2 }}>
        


        {/* Confetti elegante flotante */}
        {Array.from({length: 12}).map((_, i) => (
          <div 
            key={i}
            className={`confetti-piece animate-confetti-drop ${
              i % 3 === 0 ? 'confetti-gold' : 
              i % 3 === 1 ? 'confetti-pink' : 'confetti-white'
            }`}
            style={{
              left: `${5 + i * 8}%`,
              animationDelay: `${i * 0.8}s`
            }}
          />
        ))}

        <div className="container text-rose-900 mx-auto px-4 p-6 rounded-2xl relative z-10">
          <div className="max-w-6xl mx-auto">
            
            {/* Layout tipo escenario con imagen central */}
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              
              {/* Card de Ceremonia - Slide desde izquierda */}
              <div className={getElegantAnimationClass(ceremonyCardVisible, 'card-slide-left', 'delay-400')}>
                <div className="ceremony-card rounded-2xl p-8 text-center space-y-6 animate-theatrical-glow">
                  <div className="text-5xl font-main-text mb-4 elegant-text-glow text-blue-700">
                    Ceremonia
                  </div>
                  <h4 className={ceremonyCardVisible ? completeClass : basicClass}>
                    {ceremony.venue}
                  </h4>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-6 h-6" style={{ color: '#FFD700' }} />
                    <span className="text-2xl font-medium elegant-text-glow">
                      {ceremony.time}
                    </span>
                  </div>
                  <p className="text-rose-900/80">
                    {ceremony.address}
                  </p>
                  <Button
                    onClick={() => window.open(ceremony.ubiLink, "_blank")}
                    className="text-rose-900 rounded-full px-8 py-3 transform hover:scale-105 transition-all duration-300"
                    style={{ backgroundColor: '#FFD700', hover: { backgroundColor: '#DAA520' } }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Ir al mapa
                  </Button>
                </div>
              </div>

              {/* Imagen central con efecto spotlight */}
              <div 
              style={{display:'none'}}
              className={getElegantAnimationClass(imageVisible, 'curtain-reveal', 'delay-600')}>
                <div className="spotlight-image relative w-full h-96 rounded-2xl shadow-2xl overflow-hidden mx-auto">
                  <Image
                    src={ceremony.ceremonyImage}
                    alt="Ceremony Image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* El efecto spotlight se aplica via CSS */}
                </div>
              </div>

              {/* Card de Recepción - Slide desde derecha */}
              <div className={getElegantAnimationClass(partyCardVisible, 'card-slide-right', 'delay-800')}>
                <div className="ceremony-card rounded-2xl p-8 text-center space-y-6 animate-theatrical-glow">
                  <div className="text-5xl font-main-text mb-4 elegant-text-glow" style={{ color: '#DC143C' }}>
                    Recepción
                  </div>
                  <h4 className={partyCardVisible ? "text-2xl font-bold text-blue-700 animate-elegant-float" : "text-2xl font-bold text-blue-700"}>
                    {party.venue}
                  </h4>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-6 h-6 text-blue-700" />
                    <span className="text-2xl font-medium text-blue-700">
                      {party.time}
                    </span>
                  </div>
                  <p className="text-blue-700 font-bold">
                    {party.address}
                  </p>
                  <Button
                    onClick={() => window.open(party.ubiLink, "_blank")}
                    className="text-black rounded-full px-8 py-3 transform hover:scale-105 transition-all duration-300 bg-rose-400"
                    //style={{ backgroundColor: '#DC143C', hover: { backgroundColor: '#B22222' } }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Ir al mapa
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
