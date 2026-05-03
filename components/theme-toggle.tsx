"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function useIsMounted() {
  return React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useIsMounted()

  if (!mounted) {
    return (
      <Button
        aria-label="Theme toggle loading"
        className="rounded-lg"
        disabled
        size="icon"
        variant="outline"
      >
        <Monitor className="size-4" />
      </Button>
    )
  }

  const nextTheme =
    theme === "dark" ? "light" : theme === "light" ? "system" : "dark"
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={`Switch theme to ${nextTheme}`}
          className="rounded-lg"
          size="icon"
          variant="outline"
          onClick={() => setTheme(nextTheme)}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Theme: {theme ?? "system"}</TooltipContent>
    </Tooltip>
  )
}
