"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Define the type for the slide
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
    if (!slides || slides.length === 0) {
        return null;
    }

    return (
        <section className="bg-gradient-to-r from-primary to-primary-light text-white overflow-hidden">
            <Swiper
                modules={[Pagination, Autoplay, Navigation]}
                spaceBetween={0}
                slidesPerView={1}
                pagination={{ clickable: true }}
                navigation={true}
                autoplay={{ delay: 6000, disableOnInteraction: false }}
                loop={slides.length > 1}
                className="h-[600px] w-full"
            >
                {slides.map((slide) => (
                    <SwiperSlide key={slide.id} className="relative w-full h-full">
                        {/* Background Image (Optional) */}
                        {slide.imageUrl && (
                            <div className="absolute inset-0 z-0">
                                <Image
                                    src={slide.imageUrl}
                                    alt={slide.title}
                                    fill
                                    className="object-cover opacity-30" // Lower opacity to blend with blue gradient
                                    priority
                                />
                            </div>
                        )}

                        {/* Content Content - Centered */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
                            <div className="text-center max-w-4xl mx-auto">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-md">
                                    {slide.title}
                                </h1>

                                {slide.subtitle && (
                                    <p className="text-xl md:text-2xl mb-4 text-gray-100 font-medium drop-shadow">
                                        {slide.subtitle}
                                    </p>
                                )}

                                {slide.description && (
                                    <p className="text-lg md:text-xl mb-8 text-gray-200 mx-auto max-w-3xl whitespace-pre-wrap drop-shadow">
                                        {slide.description}
                                    </p>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                                    {slide.primaryButtonText && (
                                        <Link
                                            href={slide.primaryButtonLink || "#"}
                                            className="btn-accent px-8 py-3 text-lg font-bold shadow-lg transform transition hover:scale-105"
                                        >
                                            {slide.primaryButtonText}
                                        </Link>
                                    )}

                                    {slide.secondaryButtonText && (
                                        <Link
                                            href={slide.secondaryButtonLink || "#"}
                                            className="btn-secondary bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg font-bold shadow-lg transform transition hover:scale-105"
                                        >
                                            {slide.secondaryButtonText}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
}
