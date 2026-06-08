"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "#050505",
          "--normal-text": "#ffffff",
          "--normal-border": "rgba(255, 255, 255, 0.1)",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#050505] group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl rounded-2xl font-sans",
          description: "group-[.toast]:text-white/60",
          actionButton:
            "group-[.toast]:bg-[#3054ff] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white/60",
          success: "group-[.toaster]:text-white group-[.toaster]:border-[#3054ff]/30",
          error: "group-[.toaster]:text-white group-[.toaster]:border-red-500/30",
          icon: "group-data-[type=error]:text-red-500 group-data-[type=success]:text-[#3054ff] group-data-[type=warning]:text-yellow-500 group-data-[type=info]:text-blue-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
