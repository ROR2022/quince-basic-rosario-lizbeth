// 🏠 HeroSection - Sección principal/portada

import React, { useEffect, useState } from "react";
//import Image from 'next/image'
import { Heart } from "lucide-react";
import { quinceMainData } from "@/components/sections/data/main-data";
import BackgroundCarrousel from "../../components/sections/BackgroundCarrousel";
//import { getOverlayStyle } from '@/utils/overlay'
//import { useScrollAnimation } from '@/hooks/useScrollAnimation'
//import { getAnimationConfig } from '@/data/animationConfig'

export default function HeroSection() {
  //const { couple, wedding } = weddingData;
  //const { heroSection } = styling
  const { hero } = quinceMainData;
  const { backgroundCarrouselImages } = hero;
  const [scrollPosition, setScrollPosition] = useState(window.scrollY);
  const [isVisible, setIsVisible] = useState(false);

  const basicClass = "font-script text-4xl text-red-500 mb-4 italic";
  const completeClass =
    "font-script text-4xl text-red-500 mb-4 scale-up-center italic";

  useEffect(() => {
    const handleScroll = () => {
      //console.log('Scroll position:', window.scrollY);
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (scrollPosition >= 0 && scrollPosition < 300) {
      setIsVisible(true);
    }
  }, [scrollPosition]);

  return (
    <section
      className="min-h-screen flex flex-col justify-center items-center relative pt-20"
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
        <source src={hero.backgroundVideo} type="video/mp4" />
        {/* Fallback a imagen si el video no carga */}
      </video>

    

      {/* Contenido principal - Usar solo animación CSS, no scroll-based */}
      <div
        style={
          {
            //backgroundColor:'#C8BFE780'
            //display: 'none',
          }
        }
        className="p-6 rounded-2xl relative z-10 text-center space-y-6 px-4"
      >
        <h1
          style={{
            textShadow: "4px 4px 8px rgba(0, 0, 0, 0.5)",
          }}
          className={isVisible ? completeClass : basicClass}
        >
          {hero.subtitle.split(" ").map((word, index) => (
            <span key={index}>
              {index === 1 ? <span className="italic">{word}</span> : word}
              {index < hero.subtitle.split(" ").length - 1 && " "}
            </span>
          ))}
        </h1>

        <div className="space-y-2">
          <div
            style={{
              textShadow: "4px 4px 8px rgba(0, 0, 0, 0.5)",
            }}
            className="text-6xl text-blue-700 font-main-text"
          >
            {hero.name}
          </div>
        </div>

        <div
          style={{ display: "none" }}
          className="flex justify-center items-center gap-4 mt-8"
        >
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <Heart className="w-8 h-8 text-secondary" />
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
        </div>

        <p
          style={{ display: "none" }}
          className="text-lg text-muted-foreground italic max-w-md mx-auto"
        >
          &ldquo;{hero.quote}&rdquo;
        </p>
      </div>
    </section>
  );
}
