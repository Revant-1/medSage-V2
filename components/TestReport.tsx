"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Download, Share2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface TestReportProps {
  data: {
    name: string
    testType: string
    formData: any
    prediction: {
      risk_score: number
      probability: number
    }
  }
  onClose?: () => void
}

export default function TestReport({ data, onClose }: TestReportProps) {
  const router = useRouter()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const getRiskLevel = (probability: number) => {
    if (probability >= 75) return { text: "High Risk", color: "text-red-600 bg-red-50" }
    if (probability >= 50) return { text: "Moderate Risk", color: "text-yellow-600 bg-yellow-50" }
    return { text: "Low Risk", color: "text-green-600 bg-green-50" }
  }

  const riskLevel = getRiskLevel(data.prediction.probability)

  const handleDownload = () => {
    setIsDownloading(true)
    // Simulate download delay
    setTimeout(() => {
      setIsDownloading(false)
      // In a real app, you would generate and download a PDF here
      alert("Download feature will be implemented in the next version")
    }, 1000)
  }

  const handleShare = () => {
    setIsSharing(true)

    // Prepare data for sharing
    const queryParams = new URLSearchParams({
      name: data.name,
      testType: data.testType,
      formData: JSON.stringify(data.formData),
      prediction: JSON.stringify(data.prediction),
    }).toString()

    // Create shareable URL
    const shareUrl = `${window.location.origin}/test-report?${queryParams}`

    // Use Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: "Heart Health Assessment Results",
          text: `Check out my heart health assessment results from MediSage!`,
          url: shareUrl,
        })
        .catch(console.error)
    } else {
      // Fallback to clipboard
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => alert("Link copied to clipboard!"))
        .catch((err) => console.error("Failed to copy link: ", err))
    }

    setTimeout(() => setIsSharing(false), 1000)
  }

  const handleViewDashboard = () => {
    router.push("/data-dashboard")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-3xl"
      >
        <div className="bg-green-600 text-white px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Heart Health Assessment Report</h2>
            {onClose && (
              <button onClick={onClose} className="text-white/80 hover:text-white">
                ×
              </button>
            )}
          </div>
          <p className="text-sm opacity-90">
            {data.testType === "test-1" ? "XGBoost Model Analysis" : "Random Forest Model Analysis"}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{data.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">{data.formData.age}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium">{data.formData.gender === "0" ? "Male" : "Female"}</p>
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
                <p className="text-xl font-bold">{data.prediction.probability.toFixed(2)}%</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 text-purple-600">
                <p className="text-sm opacity-75">Risk Score</p>
                <p className="text-xl font-bold">{data.prediction.risk_score.toFixed(3)}</p>
              </div>
            </div>
          </div>

          {/* Medical Parameters */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Medical Parameters</h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              {Object.entries(data.formData)
                .filter(([key]) => key !== "name")
                .map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-gray-500">{key}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <div className="p-4 bg-green-50 rounded-lg text-green-800">
              <ul className="list-disc pl-5 space-y-2">
                <li>Schedule a follow-up with your healthcare provider to discuss these results</li>
                <li>Maintain a heart-healthy diet rich in fruits, vegetables, and whole grains</li>
                <li>Aim for at least 150 minutes of moderate exercise per week</li>
                <li>Monitor your blood pressure and cholesterol levels regularly</li>
                <li>Consider stress-reduction techniques such as meditation or yoga</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t p-6 flex justify-between">
          <button
            onClick={onClose || handleViewDashboard}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {onClose ? "Back to Form" : "View Dashboard"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Processing..." : "Download PDF"}
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              <Share2 className="w-4 h-4" />
              {isSharing ? "Sharing..." : "Share"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
