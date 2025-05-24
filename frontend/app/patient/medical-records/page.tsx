"use client"

import { useState } from "react"
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Stethoscope,
  TestTube,
  Pill,
  Heart,
  Activity,
  AlertCircle,
  Search,
  Filter
} from "lucide-react"
import { PatientLayout } from "@/components/layout/PatientLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuthProvider } from "@/hooks/useAuthProvider"

export default function PatientMedicalRecords() {
  const { user, loading } = useAuthProvider()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  // Mock medical records data
  const medicalRecords = [
    {
      id: "1",
      date: "2024-01-10",
      type: "consultation",
      title: "Khám tổng quát",
      doctor: "Dr. Nguyễn Văn A",
      department: "Khoa Nội",
      diagnosis: "Huyết áp cao nhẹ",
      treatment: "Thuốc hạ huyết áp, chế độ ăn ít muối",
      notes: "Bệnh nhân cần theo dõi huyết áp hàng tuần",
      attachments: ["blood_pressure_chart.pdf", "prescription.pdf"]
    },
    {
      id: "2",
      date: "2024-01-05",
      type: "lab_result",
      title: "Kết quả xét nghiệm máu",
      doctor: "Dr. Trần Thị B",
      department: "Khoa Xét nghiệm",
      diagnosis: "Chỉ số đường huyết bình thường",
      treatment: "Không cần điều trị",
      notes: "Tiếp tục duy trì chế độ ăn uống lành mạnh",
      attachments: ["blood_test_results.pdf"]
    },
    {
      id: "3",
      date: "2023-12-20",
      type: "imaging",
      title: "Chụp X-quang ngực",
      doctor: "Dr. Lê Văn C",
      department: "Khoa Chẩn đoán hình ảnh",
      diagnosis: "Phổi bình thường",
      treatment: "Không cần điều trị",
      notes: "Không phát hiện bất thường",
      attachments: ["chest_xray.jpg", "radiology_report.pdf"]
    },
    {
      id: "4",
      date: "2023-12-15",
      type: "prescription",
      title: "Đơn thuốc điều trị huyết áp",
      doctor: "Dr. Nguyễn Văn A",
      department: "Khoa Nội",
      diagnosis: "Huyết áp cao",
      treatment: "Amlodipine 5mg, 1 viên/ngày",
      notes: "Uống thuốc đều đặn, tái khám sau 1 tháng",
      attachments: ["prescription_details.pdf"]
    },
    {
      id: "5",
      date: "2023-11-30",
      type: "consultation",
      title: "Khám tim mạch",
      doctor: "Dr. Phạm Thị D",
      department: "Khoa Tim mạch",
      diagnosis: "Nhịp tim bình thường",
      treatment: "Tập thể dục đều đặn",
      notes: "Tình trạng tim mạch ổn định",
      attachments: ["ecg_report.pdf", "echo_results.pdf"]
    }
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="h-4 w-4" />
      case 'lab_result':
        return <TestTube className="h-4 w-4" />
      case 'imaging':
        return <Activity className="h-4 w-4" />
      case 'prescription':
        return <Pill className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800'
      case 'lab_result':
        return 'bg-green-100 text-green-800'
      case 'imaging':
        return 'bg-purple-100 text-purple-800'
      case 'prescription':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'Consultation'
      case 'lab_result':
        return 'Lab Result'
      case 'imaging':
        return 'Imaging'
      case 'prescription':
        return 'Prescription'
      default:
        return 'Other'
    }
  }

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || record.type === filterType
    return matchesSearch && matchesFilter
  })

  // Sort records by date (newest first)
  const sortedRecords = filteredRecords.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  if (loading) {
    return (
      <PatientLayout title="Medical Records" activePage="medical-records">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    )
  }

  if (!user || user.role !== 'patient') {
    return (
      <PatientLayout title="Medical Records" activePage="medical-records">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Patient role required.</p>
          </div>
        </div>
      </PatientLayout>
    )
  }

  return (
    <PatientLayout title="Medical Records" activePage="medical-records">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
            <p className="text-gray-600">View your complete medical history and documents</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search records, doctors, or diagnoses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter records by type"
          >
            <option value="all">All Types</option>
            <option value="consultation">Consultations</option>
            <option value="lab_result">Lab Results</option>
            <option value="imaging">Imaging</option>
            <option value="prescription">Prescriptions</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Stethoscope className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Consultations</p>
                <p className="text-xl font-bold">
                  {medicalRecords.filter(r => r.type === 'consultation').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TestTube className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lab Results</p>
                <p className="text-xl font-bold">
                  {medicalRecords.filter(r => r.type === 'lab_result').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Imaging</p>
                <p className="text-xl font-bold">
                  {medicalRecords.filter(r => r.type === 'imaging').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Pill className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Prescriptions</p>
                <p className="text-xl font-bold">
                  {medicalRecords.filter(r => r.type === 'prescription').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Records List */}
      <div className="space-y-4">
        {sortedRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className={getTypeColor(record.type)}>
                      {getTypeIcon(record.type)}
                      <span className="ml-1">{getTypeLabel(record.type)}</span>
                    </Badge>
                    <h3 className="text-lg font-semibold">{record.title}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{record.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{record.doctor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{record.department}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Diagnosis: </span>
                      <span className="text-sm text-gray-900">{record.diagnosis}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Treatment: </span>
                      <span className="text-sm text-gray-900">{record.treatment}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notes: </span>
                      <span className="text-sm text-gray-900">{record.notes}</span>
                    </div>
                  </div>

                  {record.attachments.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Attachments:</span>
                      <div className="flex flex-wrap gap-2">
                        {record.attachments.map((attachment, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {attachment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedRecords.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Your medical records will appear here after your first appointment"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PatientLayout>
  )
}
