"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { ArrowLeft, Download, Share2 } from "lucide-react"

interface ReportData {
  name: string
  testType: string
  formData: any
  prediction: {
    risk_score: number
    probability: number
  }
}

export default function TestReport() {
  const searchParams = useSearchParams()
  const [reportData, setReportData] = useState<ReportData | null>(null)

  useEffect(() => {
    const name = searchParams.get("name")
    const testType = searchParams.get("testType")
    const formData = JSON.parse(searchParams.get("formData") || "{}")
    const prediction = JSON.parse(searchParams.get("prediction") || "{}")

    setReportData({ name, testType, formData, prediction })
  }, [searchParams])

  if (!reportData) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  const getRiskLevel = (probability: number) => {
    if (probability >= 75) return { text: "High Risk", color: "text-red-600 bg-red-50" }
    if (probability >= 50) return { text: "Moderate Risk", color: "text-yellow-600 bg-yellow-50" }
    return { text: "Low Risk", color: "text-green-600 bg-green-50" }
  }

  const riskLevel = getRiskLevel(reportData.prediction.probability)

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/data-dashboard">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="bg-green-600 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">Heart Health Assessment Report</h2>
            <p className="text-sm opacity-90">
              {reportData.testType === "test-1" ? "XGBoost Model Analysis" : "Random Forest Model Analysis"}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Patient Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{reportData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-medium">{reportData.formData.age}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{reportData.formData.gender === "0" ? "Male" : "Female"}</p>
                </div>
              </div>
            </div>

            {/* Prediction Results */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Prediction Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${riskLevel.color}`}>
                  <p className="text-sm opacity-75">Risk Level</p>
                  <p className="text-xl font-bold">{riskLevel.text}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 text-blue-600">
                  <p className="text-sm opacity-75">Probability of CVD</p>
                  <p className="text-xl font-bold">{reportData.prediction.probability.toFixed(2)}%</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 text-purple-600">
                  <p className="text-sm opacity-75">Risk Score</p>
                  <p className="text-xl font-bold">{reportData.prediction.risk_score.toFixed(3)}</p>
                </div>
              </div>
            </div>

            {/* Medical Parameters */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Medical Parameters</h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                {Object.entries(reportData.formData)
                  .filter(([key]) => key !== "name")
                  .map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-500">{key}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="border-t p-6 flex justify-between">
            <Link href="/data-dashboard">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                View Dashboard
              </button>
            </Link>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
