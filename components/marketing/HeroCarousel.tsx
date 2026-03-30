"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

type HeroSlideProps = {
    id: string;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    primaryButtonText?: string | null;
    primaryButtonLink?: string | null;
    secondaryButtonText?: string | null;
    secondaryButtonLink?: string | null;
};

export default function HeroCarousel({ slides }: { slides: HeroSlideProps[] }) {
    if (!slides || slides.length === 0) return null;

    return (
        <section className="relative overflow-hidden">
            <Swiper
                modules={[Pagination, Autoplay, Navigation, EffectFade]}
                effect="fade"
                spaceBetween={0}
                slidesPerView={1}
                pagination={{ clickable: true }}
                navigation={true}
                autoplay={{ delay: 6000, disableOnInteraction: false }}
                loop={slides.length > 1}
                className="h-[580px] md:h-[640px] w-full hero-swiper"
            >
                {slides.map((slide) => (
                    <SwiperSlide key={slide.id} className="relative w-full h-full">
                        {/* Background Image */}
                        {slide.imageUrl ? (
                            <div className="absolute inset-0 z-0">
                                <Image
                                    src={slide.imageUrl}
                                    alt={slide.title}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="100vw"
                                />
                                {/* Dark gradient overlay — left-heavy for text legibility */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />
                            </div>
                        ) : (
                            /* Fallback gradient if no image */
                            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0d2d6b] to-[#1a4a9f]" />
                        )}

                        {/* Content — left-aligned for photo slides */}
                        <div className="relative z-10 w-full h-full flex items-center px-6 sm:px-10 lg:px-20">
                            <div className="max-w-2xl">
                                {/* Eyebrow tag */}
                                <span className="inline-block text-xs font-bold tracking-widest uppercase text-amber-400 mb-4 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
                                    C5K Academic Publishing
                                </span>

                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                                    {slide.title}
                                </h1>

                                {slide.subtitle && (
                                    <p className="text-lg md:text-xl text-blue-100 font-medium mb-3 drop-shadow">
                                        {slide.subtitle}
                                    </p>
                                )}

                                {slide.description && (
                                    <p className="text-sm md:text-base text-gray-200 mb-8 leading-relaxed max-w-xl">
                                        {slide.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    {slide.primaryButtonText && (
                                        <Link
                                            href={slide.primaryButtonLink || "#"}
                                            className="inline-flex items-center gap-2 px-7 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-lg shadow-lg transition-all hover:shadow-amber-500/30 hover:-translate-y-0.5 text-sm md:text-base"
                                        >
                                            {slide.primaryButtonText}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    )}
                                    {slide.secondaryButtonText && (
                                        <Link
                                            href={slide.secondaryButtonLink || "#"}
                                            className="inline-flex items-center gap-2 px-7 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/30 backdrop-blur-sm transition-all hover:-translate-y-0.5 text-sm md:text-base"
                                        >
                                            {slide.secondaryButtonText}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Slide number indicator */}
                        <div className="absolute bottom-12 right-8 z-20 hidden md:flex items-center gap-2 text-white/60 text-xs font-mono">
                            <div className="w-8 h-px bg-white/30" />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <style jsx global>{`
                .hero-swiper .swiper-button-next,
                .hero-swiper .swiper-button-prev {
                    color: white;
                    background: rgba(255,255,255,0.12);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 50%;
                    width: 44px;
                    height: 44px;
                    transition: background 0.2s;
                }
                .hero-swiper .swiper-button-next:hover,
                .hero-swiper .swiper-button-prev:hover {
                    background: rgba(255,255,255,0.25);
                }
                .hero-swiper .swiper-button-next::after,
                .hero-swiper .swiper-button-prev::after {
                    font-size: 16px;
                    font-weight: 700;
                }
                .hero-swiper .swiper-pagination-bullet {
                    background: rgba(255,255,255,0.5);
                    opacity: 1;
                    width: 8px;
                    height: 8px;
                    transition: all 0.3s;
                }
                .hero-swiper .swiper-pagination-bullet-active {
                    background: #f59e0b;
                    width: 24px;
                    border-radius: 4px;
                }
            `}</style>
        </section>
    );
}
