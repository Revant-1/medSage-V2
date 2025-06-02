"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/components/theme-provider"
import {
  Bell,
  Moon,
  Shield,
  Globe,
  Database,
  Download,
  HelpCircle,
  Loader2,
  AlertCircle,
  Check,
  Sun,
  Monitor,
} from "lucide-react"
import { motion } from "framer-motion"

interface UserSettings {
  userId: string
  notifications: boolean
  language: string
  dataSharing: boolean
  createdAt: string
  updatedAt: string
}

export default function Settings() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/settings")
      const data = await response.json()

      if (data.success) {
        setSettings(data.settings)
      } else {
        setError(data.error || "Failed to load settings")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setError("Failed to load settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = async (updatedSettings: Partial<UserSettings>) => {
    try {
      setIsSaving(true)
      setError("")
      setSuccessMessage("")

      const newSettings = { ...settings, ...updatedSettings }

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(newSettings as UserSettings)
        setSuccessMessage("Settings updated successfully")

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("")
        }, 3000)
      } else {
        setError(data.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      setError("Failed to update settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSetting = (setting: keyof UserSettings) => {
    if (!settings) return

    const value = settings[setting]
    if (typeof value === "boolean") {
      updateSettings({ [setting]: !value } as Partial<UserSettings>)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center mb-6 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center mb-6 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
            <Check className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Preferences Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700"
          >
            <div className="p-4 bg-gray-50 border-b dark:bg-gray-900 dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-gray-100">Preferences</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 dark:bg-blue-900/30">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-200">Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates and alerts</p>
                  </div>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={settings?.notifications}
                    onChange={() => toggleSetting("notifications")}
                    className="opacity-0 w-0 h-0"
                    disabled={isSaving}
                  />
                  <span
                    className={`absolute top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all ${
                      settings?.notifications ? "bg-green-500" : ""
                    } ${isSaving ? "opacity-50" : ""}`}
                  />
                  <span
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-all ${
                      settings?.notifications ? "translate-x-6" : ""
                    }`}
                  />
                </label>
              </div>

              {/* Theme Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 dark:bg-purple-900/30">
                    {theme === "light" ? (
                      <Sun className="w-5 h-5" />
                    ) : theme === "dark" ? (
                      <Moon className="w-5 h-5" />
                    ) : (
                      <Monitor className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-200">Theme</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred theme</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`p-2 rounded-md ${
                      theme === "light" ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    aria-label="Light theme"
                  >
                    <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`p-2 rounded-md ${
                      theme === "dark" ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    aria-label="Dark theme"
                  >
                    <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`p-2 rounded-md ${
                      theme === "system" ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    aria-label="System theme"
                  >
                    <Monitor className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Language Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 dark:bg-green-900/30">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-200">Language</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred language</p>
                  </div>
                </div>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  value={settings?.language || "en"}
                  onChange={(e) => updateSettings({ language: e.target.value })}
                  disabled={isSaving}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Privacy & Security Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700"
          >
            <div className="p-4 bg-gray-50 border-b dark:bg-gray-900 dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-gray-100">Privacy & Security</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Data Sharing Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 dark:bg-red-900/30">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-200">Data Sharing</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Share anonymized data for research</p>
                  </div>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={settings?.dataSharing}
                    onChange={() => toggleSetting("dataSharing")}
                    className="opacity-0 w-0 h-0"
                    disabled={isSaving}
                  />
                  <span
                    className={`absolute top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all ${
                      settings?.dataSharing ? "bg-green-500" : ""
                    } ${isSaving ? "opacity-50" : ""}`}
                  />
                  <span
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-all ${
                      settings?.dataSharing ? "translate-x-6" : ""
                    }`}
                  />
                </label>
              </div>

              {/* Security Settings */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 dark:bg-yellow-900/30">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-200">Security Settings</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your security preferences</p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  onClick={() => alert("Security settings page coming soon!")}
                  disabled={isSaving}
                >
                  Manage
                </button>
              </div>

              {/* Export Data */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 dark:bg-green-900/30">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-200">Export Your Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Download all your health data</p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  onClick={() => alert("Data export feature coming soon!")}
                  disabled={isSaving}
                >
                  Export
                </button>
              </div>
            </div>
          </motion.div>

          {/* Help & Support Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700"
          >
            <div className="p-4 bg-gray-50 border-b dark:bg-gray-900 dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-gray-100">Help & Support</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 dark:bg-blue-900/30">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium dark:text-gray-200">Need Help?</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Contact our support team for assistance</p>
                </div>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors dark:bg-green-700 dark:hover:bg-green-800"
                  onClick={() => alert("Support contact form coming soon!")}
                  disabled={isSaving}
                >
                  Contact Support
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
