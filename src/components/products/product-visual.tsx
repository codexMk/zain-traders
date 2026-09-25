"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductVisualProps = {
  src: string;
  alt: string;
  sizes: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  wrapperClassName?: string;
  objectPosition?: string;
};

export function ProductVisual({
  src,
  alt,
  sizes,
  fill = true,
  priority = false,
  className,
  wrapperClassName,
  objectPosition,
}: ProductVisualProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.2),rgba(255,255,255,0.72),rgba(255,255,255,0.2))] bg-[length:200%_100%] transition-opacity duration-500",
          isLoaded ? "opacity-0" : "animate-[shimmer_1.8s_linear_infinite]",
        )}
      />
      <Image
        src={src}
        alt={alt}
        fill={fill}
        priority={priority}
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "transition duration-700",
          isLoaded ? "scale-100 opacity-100" : "scale-[1.02] opacity-0",
          className,
        )}
        style={objectPosition ? { objectPosition } : undefined}
      />
    </div>
  );
}
