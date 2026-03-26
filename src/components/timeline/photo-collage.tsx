"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { clTransform, buildTransformFromDisplay } from "@/lib/cloudinary";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { ParallaxContainer } from "@/components/ui/parallax-container";
import type { DisplayTransform } from "@/lib/types";

export const PhotoCollage = ({ 
    photos, 
    title, 
    displayTransform, 
    audioUrl 
}: { 
    photos: string[], 
    title: string, 
    displayTransform?: DisplayTransform, 
    audioUrl?: string | null 
}) => {
    const photoCount = photos.length;
    const t = buildTransformFromDisplay(displayTransform);

    const renderGrid = () => {
        const objectClass = t.c === 'fit' ? "object-contain" : "object-cover";
        switch (photoCount) {
            case 1:
                return (
                    <div className="max-h-[600px] sm:max-h-[70vh] w-full flex items-center justify-center bg-black/5 overflow-hidden">
                        <ImageLightbox
                            src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                            photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit", g: "auto" }))}
                            audioUrl={audioUrl}
                            initialIndex={0}
                            alt={title}
                            width={t.w}
                            height={t.h}
                        >
                            <ParallaxContainer speed={0.03} className="w-full h-full">
                                <Image
                                    src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                                    alt={title}
                                    width={t.w}
                                    height={t.h}
                                    className={cn("w-full h-auto max-h-[600px] sm:max-h-[70vh] md:h-[450px]", objectClass)}
                                    data-ai-hint="travel photo"
                                />
                            </ParallaxContainer>
                        </ImageLightbox>
                    </div>
                );
            case 2:
                return (
                    <div className="grid grid-cols-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        {photos.map((photo, index) => (
                            <ImageLightbox
                                key={index}
                                src={clTransform(photo, { w: t.w, h: t.h, c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={index}
                                showAudioIcon={index === 0}
                                alt={`${title} ${index + 1}`}
                                width={t.w}
                                height={t.h}
                            >
                                <ParallaxContainer speed={0.02 * (index + 1)} className="w-full h-full">
                                    <Image
                                        src={clTransform(photo, { w: t.w, h: t.h, c: t.c, g: t.g })}
                                        alt={`${title} ${index + 1}`}
                                        width={t.w}
                                        height={t.h}
                                        className={cn("w-full h-full first:rounded-tl-xl last:rounded-tr-xl", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        ))}
                    </div>
                );
            case 3:
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        <div className="col-span-1 row-span-2">
                            <ImageLightbox
                                src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={0}
                                alt={`${title} 1`}
                                width={t.w}
                                height={t.h}
                            >
                                <ParallaxContainer speed={0.03} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                                        alt={`${title} 1`}
                                        width={t.w}
                                        height={t.h}
                                        className={cn("w-full h-full rounded-tl-xl", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        </div>
                        <div className="col-span-1 row-span-1">
                            <ImageLightbox
                                src={clTransform(photos[1], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={1}
                                showAudioIcon={false}
                                alt={`${title} 2`}
                                width={t.w}
                                height={Math.round(t.h * 0.66)}
                            >
                                <ParallaxContainer speed={0.02} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[1], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                        alt={`${title} 2`}
                                        width={t.w}
                                        height={Math.round(t.h * 0.66)}
                                        className={cn("w-full h-full rounded-tr-xl", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        </div>
                        <div className="col-span-1 row-span-1">
                            <ImageLightbox
                                src={clTransform(photos[2], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={2}
                                showAudioIcon={false}
                                alt={`${title} 3`}
                                width={t.w}
                                height={Math.round(t.h * 0.66)}
                            >
                                <ParallaxContainer speed={0.04} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[2], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                        alt={`${title} 3`}
                                        width={t.w}
                                        height={Math.round(t.h * 0.66)}
                                        className={cn("w-full h-full", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        {photos.map((photo, index) => (
                            <ImageLightbox
                                key={index}
                                src={clTransform(photo, { w: t.w, h: t.h, c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={index}
                                showAudioIcon={index === 0}
                                alt={`${title} ${index + 1}`}
                                width={t.w}
                                height={t.h}
                            >
                                <ParallaxContainer speed={0.02 * (index + 0.5)} className="w-full h-full">
                                    <Image
                                        src={clTransform(photo, { w: t.w, h: t.h, c: t.c, g: t.g })}
                                        alt={`${title} ${index + 1}`}
                                        width={t.w}
                                        height={t.h}
                                        className={cn("w-full h-full",
                                            objectClass,
                                            index === 0 && "rounded-tl-xl",
                                            index === 1 && "rounded-tr-xl"
                                        )}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        ))}
                    </div>
                );
            default: // 5+ photos
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        <div className="col-span-1 row-span-2">
                            <ImageLightbox
                                src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={0}
                                alt={`${title} 1`}
                                width={t.w}
                                height={t.h}
                            >
                                <ParallaxContainer speed={0.03} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                                        alt={`${title} 1`}
                                        width={t.w}
                                        height={t.h}
                                        className={cn("w-full h-full rounded-tl-xl", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        </div>
                        <div className="col-span-1 row-span-1 relative">
                            <ImageLightbox
                                src={clTransform(photos[1], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={1}
                                showAudioIcon={false}
                                alt={`${title} 2`}
                                width={t.w}
                                height={Math.round(t.h * 0.66)}
                            >
                                <ParallaxContainer speed={0.02} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[1], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                        alt={`${title} 2`}
                                        width={t.w}
                                        height={Math.round(t.h * 0.66)}
                                        className={cn("w-full h-full rounded-tr-xl", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        </div>
                        <div className="col-span-1 row-span-1 relative">
                            <ImageLightbox
                                src={clTransform(photos[2], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={2}
                                showAudioIcon={false}
                                alt={`${title} 3`}
                                width={t.w}
                                height={Math.round(t.h * 0.66)}
                            >
                                <ParallaxContainer speed={0.04} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[2], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                        alt={`${title} 3`}
                                        width={t.w}
                                        height={Math.round(t.h * 0.66)}
                                        className={cn("w-full h-full", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                            {photos.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none z-20">
                                    <span className="text-white text-2xl font-bold">+{photos.length - 3}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return <div className="w-full">{renderGrid()}</div>
}
