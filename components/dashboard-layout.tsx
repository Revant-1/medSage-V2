"use client"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import Nav from "@/components/nav"
import MobileNav from "@/components/mobile-nav"
import { User, Menu, Bell, LayoutDashboard, MessageSquare, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user } = useAuth()

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-30 px-4 flex items-center justify-between mobile-header dark:bg-gray-900 dark:border-b dark:border-gray-800">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 touch-feedback dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Menu className="w-6 h-6" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-lime-400 to-green-500 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-green-600 dark:text-green-500">MediSage</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 relative touch-feedback dark:text-gray-300 dark:hover:bg-gray-800">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-64 bg-white shadow-lg dark:bg-gray-900 dark:border-r dark:border-gray-800">
          <div className="p-6 border-b dark:border-gray-800">
            <Link href="/dashboard">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-green-500 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                  MediSage
                </span>
              </div>
            </Link>
          </div>
          <Nav />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto p-4 lg:p-8"
          >
            <div className="flex justify-between items-center mb-6">
              {title && (
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2 dark:text-gray-100">{title}</h1>
                </div>
              )}
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
            </div>
            {children}
          </motion.div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t z-30 flex items-center justify-around mobile-tab-bar dark:bg-gray-900 dark:border-gray-800">
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center text-gray-600 hover:text-green-600 touch-feedback dark:text-gray-300 dark:hover:text-green-500"
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          href="/chat"
          className="flex flex-col items-center justify-center text-gray-600 hover:text-green-600 touch-feedback dark:text-gray-300 dark:hover:text-green-500"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="text-xs mt-1">Chat</span>
        </Link>
        <Link
          href="/documents"
          className="flex flex-col items-center justify-center text-gray-600 hover:text-green-600 touch-feedback dark:text-gray-300 dark:hover:text-green-500"
        >
          <FileText className="w-6 h-6" />
          <span className="text-xs mt-1">Docs</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center justify-center text-gray-600 hover:text-green-600 touch-feedback dark:text-gray-300 dark:hover:text-green-500"
        >
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  )
}
