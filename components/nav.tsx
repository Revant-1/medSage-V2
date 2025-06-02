"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LayoutDashboard, MessageSquare, FileText, BarChart2, Settings, User, LogOut } from "lucide-react"

export default function Nav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/chat", icon: MessageSquare, label: "Chat" },
    { href: "/chat-history", icon: MessageSquare, label: "Chat History" },
    { href: "/documents", icon: FileText, label: "Documents" },
    { href: "/data-dashboard", icon: BarChart2, label: "Data Dashboard" },
    { href: "/settings", icon: Settings, label: "Settings" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <div className="h-full flex flex-col justify-between py-6">
      <div className="space-y-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all
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
        <div className="px-4">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 text-gray-600 hover:text-red-600 transition-colors w-full px-4 py-3 rounded-lg hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}
