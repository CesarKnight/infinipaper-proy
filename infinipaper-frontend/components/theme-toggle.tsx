"use client"

import { useTheme } from "next-themes"
import { CheckIcon, MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ] as const

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Toggle theme" />}
      >
        <SunIcon data-icon="inline-start" className="hidden dark:block" />
        <MoonIcon data-icon="inline-start" className="block dark:hidden" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
            >
              {option.value === "light" && <SunIcon data-icon="inline-start" />}
              {option.value === "dark" && <MoonIcon data-icon="inline-start" />}
              {option.value === "system" && (
                <span className="flex size-4 items-center justify-center text-xs">A</span>
              )}
              {option.label}
              {option.value === theme && (
                <CheckIcon className="ml-auto size-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ThemeToggle }