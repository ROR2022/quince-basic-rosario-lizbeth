// 👗 DressCodeSection - Sección de código de vestimenta y confirmación

import React, { useEffect, useState, useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { getAnimationConfig } from "@/data/animationConfig";
import { GiLargeDress } from "react-icons/gi";
import Image from "next/image";
import { quinceMainData } from "@/components/sections/data/main-data";

export default function DressCodeSection() {
  
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const { event, dressCode } = quinceMainData;
  const { parents } = event;

  // IntersectionObserver para animaciones escalonadas que se reactivan
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
   
  return (
    <section
      ref={sectionRef}
      id="dresscode"
      className="py-20 relative"
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
        <source src={dressCode.backgroundVideo} type="video/mp4" />
      </video>

      
      <div
        style={{
          animation: "bounce1 2s ease 0s 1 infinite",
          position: 'relative',
          zIndex: 2
        }}
        className="container mx-auto px-4 p-6 rounded-2xl"
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Título - Animación desde arriba */}
          <h2 
            className={`font-main-text text-5xl text-blue-700 transition-all duration-700 ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 -translate-y-8'
            }`}
            //style={{ color: '#FFD700' }}
          >
            Código de Vestimenta
          </h2>
          
          {/* Imagen - Animación con escala */}
          <div className={`flex gap-4 justify-center items-center bg-white/30 p-4 rounded-lg shadow-lg transition-all duration-700 delay-300 ${
            isVisible 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-75'
          }`}>
            <div>
              <Image
                src={dressCode.backgroundImage}
                alt="Código de Vestimenta"
                width={100}
                height={200}
                className="mx-auto rounded-lg"
                style={{ width: '100px', height: 'auto' }}
              />
            </div>
          </div>
          
          {/* Mensaje principal - Animación desde la izquierda */}
          <h3 className={`text-3xl font-bold text-rose-900 transition-all duration-700 delay-600 ${
            isVisible 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 -translate-x-8'
          }`}>
            {dressCode.message}
          </h3>
          
          {/* Subtítulo - Animación desde la derecha */}
          <p 
            className={`text-2xl transition-all duration-700 delay-700 text-rose-900 font-bold ${
              isVisible 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 translate-x-8'
            }`}
            //style={{ color: '#C0C0C0' }}
          >
            {dressCode.subtitle}
          </p>

          {/* Restricción - Animación desde abajo */}
          <p 
            className={`text-xl my-4 font-bold transition-all duration-700 delay-1000 ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
            style={{ color: '#DC143C', display:'none' }}
          >
            {dressCode.restriction}
          </p>

          
        </div>
      </div>
    </section>
  );
}
