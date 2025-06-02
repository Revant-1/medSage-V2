"use client"

import type React from "react"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { Card } from "@/components/ui/card"
import { Heart, Activity, Droplet, FileText, MessageSquare, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface MetricCardProps {
  title: string
  value: string
  unit: string
  icon: React.ReactNode
  color: string
}

const MetricCard = ({ title, value, unit, icon, color }: MetricCardProps) => (
  <Card className={`p-4 ${color} text-white rounded-xl`}>
    <div className="flex justify-between items-start">
      <div>
        <div className="text-sm opacity-90 mb-1">{title}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-xs opacity-75">{unit}</div>
      </div>
      {icon}
    </div>
  </Card>
)

export default function Dashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState({
    heartRate: 72,
    bloodPressure: 120,
    spo2: 98,
    cholesterol: 180,
  })

  useEffect(() => {
    // Fetch metrics from API
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/health-data?userId=default")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Calculate averages from the latest readings
            setMetrics({
              heartRate: data.data.heartRate[data.data.heartRate.length - 1]?.value || 72,
              bloodPressure: data.data.bloodPressure[data.data.bloodPressure.length - 1]?.systolic || 120,
              spo2: 98, // This could come from a different endpoint
              cholesterol: data.data.cholesterol[data.data.cholesterol.length - 1]?.total || 180,
            })
          }
        }
      } catch (error) {
        console.error("Error fetching metrics:", error)
      }
    }

    fetchMetrics()
  }, [])

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Doctor Illustration */}
        <div className="lg:col-span-3 hidden lg:block">
          <Image
            src="/placeholder.svg?height=300&width=300"
            alt="Doctor illustration"
            width={300}
            height={300}
            className="w-full"
          />
        </div>

        {/* Right Column - Charts and Metrics */}
        <div className="lg:col-span-9 space-y-6">
          {/* Welcome Message */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-lime-50 border-none">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome back, {user?.name || "User"}</h2>
            <p className="text-gray-600">Here's a summary of your health metrics</p>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Heart Rate"
              value={metrics.heartRate.toString()}
              unit="bpm"
              color="bg-red-400"
              icon={<Heart className="w-6 h-6" />}
            />
            <MetricCard
              title="Blood Pressure"
              value={metrics.bloodPressure.toString()}
              unit="mmHg"
              color="bg-cyan-400"
              icon={<Activity className="w-6 h-6" />}
            />
            <MetricCard
              title="SpO2"
              value={metrics.spo2.toString()}
              unit="%"
              color="bg-blue-500"
              icon={<Droplet className="w-6 h-6" />}
            />
            <MetricCard
              title="Cholesterol"
              value={metrics.cholesterol.toString()}
              unit="mg/dL"
              color="bg-orange-400"
              icon={<Heart className="w-6 h-6" />}
            />
          </div>

          {/* AI Chatbot */}
          <Card className="p-4 md:p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-8 h-8 bg-lime-200 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <Link href="/chat">
                  <h3 className="font-bold mb-2">Wellness AI Chatbot</h3>
                  <p className="bg-lime-100 p-3 md:p-4 rounded-lg text-sm">
                    Ask me anything about your medical reports or health tips—I'm here to make your life easier and
                    healthier! 😊
                  </p>
                </Link>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type something..."
                className="flex-1 px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Link href="/chat">
                <button className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/documents">
              <Card className="p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">View Documents</h3>
                    <p className="text-sm text-gray-500">Access your health records</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/documents">
              <Card className="p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Upload className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Upload Documents</h3>
                    <p className="text-sm text-gray-500">Add new health records</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
