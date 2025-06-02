"use client"

import { useState, useEffect } from "react"
import { User, Menu, Share2, Copy, Check, Download } from "lucide-react"
import Nav from "@/components/nav"
import Link from "next/link"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { saveAs } from "file-saver"

interface HealthData {
  userId: string
  heartRate: { date: string; value: number }[]
  bloodPressure: { date: string; systolic: number; diastolic: number }[]
  cholesterol: { date: string; total: number; ldl: number; hdl: number }[]
  glucose: { date: string; value: number }[]
  weight: { date: string; value: number }[]
}

interface TestResult {
  _id: string
  name: string
  testType: string
  formData: any
  prediction: {
    risk_score: number
    probability: number
    prediction: number
  }
  timestamp: string
}

const DataDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("charts")
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  // Fetch health data and test results
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch health metrics
        const healthResponse = await fetch("/api/health-data?userId=default")

        if (!healthResponse.ok) {
          throw new Error(`Error fetching health data: ${healthResponse.status}`)
        }

        const healthData = await healthResponse.json()

        if (healthData.success) {
          setHealthData(healthData.data)
        }

        // Fetch test results
        const testResponse = await fetch("/api/test-results")
        if (testResponse.ok) {
          const data = await testResponse.json()
          if (data.success) {
            setTestResults(data.data)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate statistics
  const calculateStats = () => {
    if (!healthData) return null

    const heartRates = healthData.heartRate.map((item) => item.value)
    const systolicValues = healthData.bloodPressure.map((item) => item.systolic)
    const diastolicValues = healthData.bloodPressure.map((item) => item.diastolic)
    const totalCholesterol = healthData.cholesterol.map((item) => item.total)
    const glucoseValues = healthData.glucose.map((item) => item.value)
    const weightValues = healthData.weight.map((item) => item.value)

    const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const min = (arr: number[]) => Math.min(...arr)
    const max = (arr: number[]) => Math.max(...arr)

    return {
      heartRate: {
        avg: average(heartRates).toFixed(1),
        min: min(heartRates),
        max: max(heartRates),
      },
      bloodPressure: {
        avgSystolic: average(systolicValues).toFixed(1),
        avgDiastolic: average(diastolicValues).toFixed(1),
        minSystolic: min(systolicValues),
        maxSystolic: max(systolicValues),
        minDiastolic: min(diastolicValues),
        maxDiastolic: max(diastolicValues),
      },
      cholesterol: {
        avg: average(totalCholesterol).toFixed(1),
        min: min(totalCholesterol),
        max: max(totalCholesterol),
      },
      glucose: {
        avg: average(glucoseValues).toFixed(1),
        min: min(glucoseValues),
        max: max(glucoseValues),
      },
      weight: {
        avg: average(weightValues).toFixed(1),
        min: min(weightValues).toFixed(1),
        max: max(weightValues).toFixed(1),
      },
    }
  }

  const stats = calculateStats()

  // Handle form link sharing
  const handleCopyLink = () => {
    const baseUrl = window.location.origin
    const formUrl = `${baseUrl}/heart-test-1`
    navigator.clipboard.writeText(formUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareLink = () => {
    const baseUrl = window.location.origin
    const formUrl = `${baseUrl}/heart-test-1`

    if (navigator.share) {
      navigator
        .share({
          title: "MediSage Heart Health Assessment",
          text: "Take this heart health assessment to check your cardiovascular health.",
          url: formUrl,
        })
        .then(() => setShared(true))
        .catch(console.error)

      setTimeout(() => setShared(false), 2000)
    } else {
      handleCopyLink()
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  // Get test type display name
  const getTestTypeName = (testType: string) => {
    switch (testType) {
      case "heart-test-1":
        return "Heart Health Assessment 1"
      case "heart-test-2":
        return "Heart Health Assessment 2"
      default:
        return testType
    }
  }

  // const getGender = (testType: string) => {
  //   switch (testType) {
  //     case '0':
  //       return 'Male';
  //     case '1':
  //       return 'Female';
  //     default:
  //       return getGender;
  //   }
  // };

  // Get risk color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "text-red-600 bg-red-100"
      case "Moderate":
        return "text-yellow-600 bg-yellow-100"
      case "Low":
        return "text-green-600 bg-green-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  // Export data as CSV
  const exportCSV = () => {
    if (!testResults.length) return

    const headers = ["Test Type", "Date", "Score", "Risk"]
    const csvContent = [
      headers.join(","),
      ...testResults.map((test) =>
        [
          getTestTypeName(test.testType),
          formatDate(test.timestamp),
          test.prediction.risk_score,
          getRiskLevel(test.prediction.probability).text,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, "test_results.csv")
  }

  // Get risk level
  const getRiskLevel = (probability: number) => {
    if (probability >= 75) return { text: "High Risk", color: "text-red-600" }
    if (probability >= 50) return { text: "Moderate Risk", color: "text-yellow-600" }
    return { text: "Low Risk", color: "text-green-600" }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 to-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-30
            w-64 bg-white shadow-lg
          `}
        >
          <div className="p-6">
            <Link href="/home">
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
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2 pl-16 lg:pl-0">Health Data Dashboard</h1>
              <p className="text-gray-600 pl-16 lg:pl-0 mb-4">Track and analyze your health metrics over time</p>

              {/* Assessment Form Buttons */}
              <div className="flex flex-wrap gap-3 mb-6 pl-16 lg:pl-0">
                <Link href="/heart-test-1">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Heart Test 1
                  </button>
                </Link>
                <Link href="/heart-test-2">
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                    Heart Test 2
                  </button>
                </Link>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Form Link"}
                </button>
                <button
                  onClick={handleShareLink}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {shared ? "Shared!" : "Share Form"}
                </button>
                <button
                  onClick={exportCSV}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b mb-6 pl-16 lg:pl-0">
                <button
                  className={`px-4 py-2 font-medium ${
                    activeTab === "charts"
                      ? "text-green-600 border-b-2 border-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("charts")}
                >
                  Charts
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    activeTab === "table"
                      ? "text-green-600 border-b-2 border-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("table")}
                >
                  Data Table
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
            ) : (
              <>
                {activeTab === "charts" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk Distribution Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Low Risk",
                                  value: testResults.filter((t) => t.prediction.probability < 50).length,
                                },
                                {
                                  name: "Moderate Risk",
                                  value: testResults.filter(
                                    (t) => t.prediction.probability >= 50 && t.prediction.probability < 75,
                                  ).length,
                                },
                                {
                                  name: "High Risk",
                                  value: testResults.filter((t) => t.prediction.probability >= 75).length,
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {testResults.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={["#10B981", "#FBBF24", "#EF4444"][index]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Risk Score Trend */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Risk Score Trend</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={testResults.slice().reverse()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                              formatter={(value) => [`${value.toFixed(2)}`, "Risk Score"]}
                            />
                            <Line type="monotone" dataKey="prediction.risk_score" stroke="#10B981" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Test Type Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Test Type Distribution</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              {
                                name: "XGBoost Model",
                                count: testResults.filter((t) => t.testType === "test-1").length,
                              },
                              {
                                name: "Random Forest",
                                count: testResults.filter((t) => t.testType === "test-2").length,
                              },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8">
                              <Cell fill="#10B981" />
                              <Cell fill="#6366F1" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Probability Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Probability Distribution</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={testResults.slice().reverse()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
                            />
                            <YAxis domain={[0, 100]} />
                            <Tooltip
                              labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                              formatter={(value) => [`${value.toFixed(2)}%`, "Probability"]}
                            />
                            <Line type="monotone" dataKey="prediction.probability" stroke="#6366F1" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "table" && (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Test Results History</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Name
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Test Type
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Risk Level
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Probability
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {testResults.map((result) => (
                            <tr key={result._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {result.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {result.testType === "test-1" ? "XGBoost Model" : "Random Forest Model"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getRiskLevel(result.prediction.probability).text}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {result.prediction.probability.toFixed(2)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(result.timestamp).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataDashboard
