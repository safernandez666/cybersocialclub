"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "pulse" | "shimmer" | "none"
  shape?: "rectangle" | "circle" | "rounded"
  width?: string
  height?: string
}

function Skeleton({
  className,
  variant = "pulse",
  shape = "rectangle",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = "bg-white/[0.06]"
  
  const shapeStyles = {
    rectangle: "rounded-lg",
    circle: "rounded-full",
    rounded: "rounded-xl",
  }

  const animationStyles = {
    pulse: "animate-pulse",
    shimmer: "relative overflow-hidden bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-[shimmer_0.8s_infinite_linear]",
    none: "",
  }

  return (
    <div
      className={cn(
        baseStyles,
        shapeStyles[shape],
        animationStyles[variant],
        className
      )}
      style={{
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/5 bg-[#141211] p-5", className)}>
      <div className="flex items-start gap-4">
        <Skeleton shape="circle" width="48px" height="48px" />
        <div className="flex-1 space-y-3">
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="14px" />
          <Skeleton width="80%" height="14px" />
        </div>
      </div>
    </div>
  )
}

function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/5 bg-[#141211] p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <Skeleton shape="rounded" width="40px" height="40px" />
        <Skeleton width="50px" height="16px" />
      </div>
      <Skeleton width="80px" height="36px" className="mb-1" />
      <Skeleton width="100px" height="12px" />
    </div>
  )
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} height="16px" />
      ))}
    </div>
  )
}

function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton width="120px" height="14px" />
          <Skeleton width="100%" height="48px" />
        </div>
      ))}
    </div>
  )
}

function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = { sm: "32px", md: "48px", lg: "64px", xl: "96px" }
  return <Skeleton shape="circle" width={sizes[size]} height={sizes[size]} />
}

function SkeletonButton({ width = "120px" }: { width?: string }) {
  return <Skeleton width={width} height="40px" shape="rounded" />
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonText,
  SkeletonForm,
  SkeletonAvatar,
  SkeletonButton,
}
