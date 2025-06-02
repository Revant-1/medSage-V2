"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LayoutDashboard, MessageSquare, FileText, BarChart2, Settings, User, LogOut, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/public-chat", icon: MessageSquare, label: "Chat" },
    { href: "/chat-history", icon: MessageSquare, label: "Chat History" },
    { href: "/documents", icon: FileText, label: "Documents" },
    { href: "/data-dashboard", icon: BarChart2, label: "Data Dashboard" },
    { href: "/settings", icon: Settings, label: "Settings" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />

          {/* Slide-in menu */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 md:hidden overflow-y-auto rounded-tr-3xl rounded-br-3xl"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <Link href="/dashboard" onClick={onClose}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-green-500 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                    MediSage
                  </span>
                </div>
              </Link>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-1">
              {navItems.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all touch-feedback
                      ${isActive ? "bg-lime-100 text-lime-700" : "text-gray-600 hover:bg-gray-100"}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-lime-700" : "text-gray-500"}`} />
                    <span className="font-medium">{label}</span>
                  </Link>
                )
              })}
            </div>

            {user && (
              <div className="p-4 border-t mt-4">
                <button
                  onClick={() => {
                    onClose()
                    logout()
                  }}
                  className="flex items-center gap-3 text-gray-600 hover:text-red-600 transition-colors w-full px-4 py-3 rounded-xl hover:bg-gray-100 touch-feedback"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
