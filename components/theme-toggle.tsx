"use client"

import type React from "react"

import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, Monitor } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const toggleTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
        aria-label="Toggle theme"
      >
        {theme === "light" && <Sun className="h-4 w-4" />}
        {theme === "dark" && <Moon className="h-4 w-4" />}
        {theme === "system" && <Monitor className="h-4 w-4" />}
      </button>

      <AnimatedThemeMenu isOpen={isOpen} theme={theme} toggleTheme={toggleTheme} />
    </div>
  )
}

function AnimatedThemeMenu({
  isOpen,
  theme,
  toggleTheme,
}: {
  isOpen: boolean
  theme: string
  toggleTheme: (theme: "light" | "dark" | "system") => void
}) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => toggleTheme(theme as "light" | "dark" | "system")} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={isOpen ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`absolute right-0 top-full z-50 mt-2 w-36 origin-top-right rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-950 ${
          !isOpen && "hidden"
        }`}
      >
        <ThemeOption
          theme="light"
          icon={<Sun className="mr-2 h-4 w-4" />}
          label="Light"
          currentTheme={theme}
          onClick={() => toggleTheme("light")}
        />
        <ThemeOption
          theme="dark"
          icon={<Moon className="mr-2 h-4 w-4" />}
          label="Dark"
          currentTheme={theme}
          onClick={() => toggleTheme("dark")}
        />
        <ThemeOption
          theme="system"
          icon={<Monitor className="mr-2 h-4 w-4" />}
          label="System"
          currentTheme={theme}
          onClick={() => toggleTheme("system")}
        />
      </motion.div>
    </>
  )
}

function ThemeOption({
  theme,
  icon,
  label,
  currentTheme,
  onClick,
}: {
  theme: string
  icon: React.ReactNode
  label: string
  currentTheme: string
  onClick: () => void
}) {
  return (
    <button
      className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${
        currentTheme === theme
          ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
      {currentTheme === theme && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto h-2 w-2 rounded-full bg-green-500"
        />
      )}
    </button>
  )
}
