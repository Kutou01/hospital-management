"use client"

import { useState, useEffect } from "react"
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
  Filter,
  Plus,
  Calendar as CalendarIcon
} from "lucide-react"
import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useEnhancedAuth } from "@/lib/auth/enhanced-auth-context"
import { useRouter, useSearchParams } from "next/navigation"

export default function PatientMedicalRecords() {
  const { user, loading } = useEnhancedAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const router = useRouter()
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')

  // State for medical records
  const [medicalRecords, setMedicalRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(true)

  // Fetch medical records on component mount
  useEffect(() => {
    // Check for newly created medical record
    const checkForNewMedicalRecord = () => {
      const pendingRecordStr = localStorage.getItem('pendingMedicalRecord');
      if (pendingRecordStr) {
        try {
          const recordData = JSON.parse(pendingRecordStr);

          // Create a new medical record entry
          const newRecord = {
            id: recordData.recordId || `mr-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: "consultation",
            title: `Khám với ${recordData.doctorName || 'bác sĩ'}`,
            doctor: recordData.doctorName || 'Chưa xác định',
            department: recordData.specialty || 'Khám tổng quát',
            diagnosis: "Đang chờ kết quả",
            treatment: "Chờ thăm khám",
            notes: "Hồ sơ tạo từ đặt lịch khám bệnh",
            attachments: [],
            paymentInfo: {
              status: recordData.paymentStatus || 'pending',
              amount: recordData.amount,
              date: new Date().toISOString()
            }
          };

          // Add to beginning of medical records
          setMedicalRecords(prevRecords => [newRecord, ...prevRecords]);

          // Don't clear pendingMedicalRecord until payment is confirmed
        } catch (e) {
          console.error('Error parsing medical record data:', e);
        }
      }

      // Also check for completed payments
      const paymentCompletedStr = localStorage.getItem('paymentCompleted');
      if (paymentCompletedStr) {
        try {
          const paymentData = JSON.parse(paymentCompletedStr);

          // Update record payment status if we have a record with matching ID
          if (paymentData.recordId) {
            setMedicalRecords(prevRecords => {
              return prevRecords.map(record => {
                if (record.id === paymentData.recordId) {
                  return {
                    ...record,
                    paymentInfo: {
                      ...record.paymentInfo,
                      status: 'completed',
                      orderCode: paymentData.orderCode
                    }
                  };
                }
                return record;
              });
            });

            // Now we can remove the pendingMedicalRecord from localStorage
            localStorage.removeItem('pendingMedicalRecord');
          }
        } catch (e) {
          console.error('Error parsing payment data:', e);
        }
      }
    };

    // Load medical records data
    const loadMedicalRecordsData = () => {
      setLoadingRecords(true);

      // Mock medical records data
      const mockMedicalRecords = [
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
      ];

      setMedicalRecords(mockMedicalRecords);

      // Check for new medical records
      checkForNewMedicalRecord();

      setLoadingRecords(false);

      // If we have an appointmentId in the URL, highlight that record
      if (appointmentId) {
        setTimeout(() => {
          const element = document.getElementById(`record-${appointmentId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }
        }, 500);
      }
    };

    if (!loading && user) {
      loadMedicalRecordsData();
    }
  }, [loading, user, appointmentId]);

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
        return 'Khám bệnh'
      case 'lab_result':
        return 'Xét nghiệm'
      case 'imaging':
        return 'Chẩn đoán hình ảnh'
      case 'prescription':
        return 'Đơn thuốc'
      default:
        return 'Khác'
    }
  }

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.doctor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || record.type === filterType
    return matchesSearch && matchesFilter
  })

  // Sort records by date (newest first)
  const sortedRecords = filteredRecords.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  if (loading || loadingRecords) {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </RoleBasedLayout>
    )
  }

  if (!user || user.role !== 'patient') {
    return (
      <RoleBasedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Patient role required.</p>
          </div>
        </div>
      </RoleBasedLayout>
    )
  }

  return (
    <RoleBasedLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Hồ sơ bệnh án</h2>
            <p className="text-gray-600">Xem toàn bộ lịch sử bệnh án và tài liệu y tế của bạn</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => router.push('/doctors')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Đặt lịch khám
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Tải về tất cả
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm bệnh án, bác sĩ, hoặc chẩn đoán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Lọc bệnh án theo loại"
          >
            <option value="all">Tất cả</option>
            <option value="consultation">Khám bệnh</option>
            <option value="lab_result">Xét nghiệm</option>
            <option value="imaging">Chẩn đoán hình ảnh</option>
            <option value="prescription">Đơn thuốc</option>
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
                <p className="text-sm text-gray-600">Khám bệnh</p>
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
                <p className="text-sm text-gray-600">Xét nghiệm</p>
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
                <p className="text-sm text-gray-600">Chẩn đoán hình ảnh</p>
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
                <p className="text-sm text-gray-600">Đơn thuốc</p>
                <p className="text-xl font-bold">
                  {medicalRecords.filter(r => r.type === 'prescription').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Records List */}
      {sortedRecords.length > 0 ? (
        <div className="space-y-4">
          {sortedRecords.map((record) => (
            <Card
              key={record.id}
              id={`record-${record.id}`}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className={getTypeColor(record.type)}>
                        {getTypeIcon(record.type)}
                        <span className="ml-1">{getTypeLabel(record.type)}</span>
                      </Badge>
                      <h3 className="text-lg font-semibold">{record.title}</h3>

                      {/* Payment status badge if available */}
                      {record.paymentInfo && (
                        <Badge className={record.paymentInfo.status === 'completed' ?
                          'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}>
                          {record.paymentInfo.status === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Ngày khám</p>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                          <p className="font-medium">{record.date}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bác sĩ</p>
                        <div className="flex items-center mt-1">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <p className="font-medium">{record.doctor}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Khoa/Chuyên khoa</p>
                        <p className="font-medium">{record.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Chẩn đoán</p>
                        <p className="font-medium">{record.diagnosis}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm text-gray-600 mb-1">Điều trị</p>
                      <p>{record.treatment}</p>
                    </div>

                    {record.notes && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <p className="text-sm text-gray-600 mb-1">Ghi chú</p>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )}

                    {record.attachments && record.attachments.length > 0 && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <p className="text-sm text-gray-600 mb-2">Tài liệu đính kèm</p>
                        <div className="flex flex-wrap gap-2">
                          {record.attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {attachment}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Chi tiết
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Tải về
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Không có bệnh án nào</h3>
          <p className="text-gray-600 mb-6">Bạn chưa có hồ sơ bệnh án nào</p>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push('/doctors')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Đặt lịch khám ngay
          </Button>
        </div>
      )}
    </RoleBasedLayout>
  )
}
