"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  CreditCardIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AdminLayout } from "@/components/layout/AdminLayout"

// Dữ liệu mẫu cho thanh toán
const paymentsData = [
  {
    id: "INV-001",
    patientName: "Carol C-Simpson",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "19 Jul 2023",
    amount: 150.0,
    method: "Credit Card",
    service: "Routine Check-Up",
    status: "Paid",
  },
  {
    id: "INV-002",
    patientName: "Steven Bennett",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "19 Jul 2023",
    amount: 350.0,
    method: "Insurance",
    service: "Cardiac Evaluation",
    status: "Pending",
  },
  {
    id: "INV-003",
    patientName: "Ocean Jane Lupre",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "19 Jul 2023",
    amount: 120.0,
    method: "Cash",
    service: "Pediatric Check-Up",
    status: "Paid",
  },
  {
    id: "INV-004",
    patientName: "Shane Riddick",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "19 Jul 2023",
    amount: 200.0,
    method: "Credit Card",
    service: "Skin Allergy",
    status: "Refunded",
  },
  {
    id: "INV-005",
    patientName: "Queen Lawriston",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "19 Jul 2023",
    amount: 180.0,
    method: "Bank Transfer",
    service: "Follow-Up Visit",
    status: "Paid",
  },
  {
    id: "INV-006",
    patientName: "Alice Mitchell",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "20 Jul 2023",
    amount: 150.0,
    method: "Credit Card",
    service: "Routine Check-Up",
    status: "Paid",
  },
  {
    id: "INV-007",
    patientName: "Mikhail Morozov",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "20 Jul 2023",
    amount: 450.0,
    method: "Insurance",
    service: "Cardiac Consultation",
    status: "Pending",
  },
  {
    id: "INV-008",
    patientName: "Mateus Fernandes",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "20 Jul 2023",
    amount: 120.0,
    method: "Cash",
    service: "Pediatric Check-Up",
    status: "Paid",
  },
  {
    id: "INV-009",
    patientName: "Pari Desai",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "21 Jul 2023",
    amount: 280.0,
    method: "Credit Card",
    service: "Skin Allergy",
    status: "Paid",
  },
  {
    id: "INV-010",
    patientName: "Omar Ali",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "21 Jul 2023",
    amount: 320.0,
    method: "Bank Transfer",
    service: "Follow-Up Visit",
    status: "Pending",
  },
]

export default function PaymentPage() {
  const [payments, setPayments] = useState(paymentsData)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [methodFilter, setMethodFilter] = useState("All Methods")
  const [dateFilter, setDateFilter] = useState("This Month")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [paymentToView, setPaymentToView] = useState<any | null>(null)

  const paymentsPerPage = 10
  const totalPayments = 156
  const totalPages = Math.ceil(totalPayments / paymentsPerPage)

  // Tính tổng doanh thu
  const totalRevenue = payments.reduce((sum, payment) => {
    if (payment.status !== "Refunded") {
      return sum + payment.amount
    }
    return sum
  }, 0)

  // Tính số lượng thanh toán theo trạng thái
  const paidCount = payments.filter((payment) => payment.status === "Paid").length
  const pendingCount = payments.filter((payment) => payment.status === "Pending").length
  const refundedCount = payments.filter((payment) => payment.status === "Refunded").length

  // Xử lý tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Xử lý lọc theo trạng thái
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
  }

  // Xử lý lọc theo phương thức thanh toán
  const handleMethodFilter = (value: string) => {
    setMethodFilter(value)
  }

  // Xử lý lọc theo ngày
  const handleDateFilter = (value: string) => {
    setDateFilter(value)
  }

  // Xử lý phân trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Xử lý xóa thanh toán
  const handleDeleteClick = (id: string) => {
    setPaymentToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (paymentToDelete) {
      setPayments(payments.filter((payment) => payment.id !== paymentToDelete))
      setIsDeleteDialogOpen(false)
      setPaymentToDelete(null)
    }
  }

  // Xử lý xem chi tiết thanh toán
  const handleViewClick = (payment: any) => {
    setPaymentToView(payment)
    setIsViewDialogOpen(true)
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "Refunded":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Refunded</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <AdminLayout title="Payment" activePage="payment">

        {/* Dashboard Cards */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</h3>
                  <p className="text-sm text-green-600 mt-1">
                    <ArrowUpRight size={14} className="inline mr-1" />
                    +12.5% from last month
                  </p>
                </div>
                <div className="p-2 rounded-full bg-green-100">
                  <DollarSign size={20} className="text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Paid Invoices</p>
                  <h3 className="text-2xl font-bold mt-1">{paidCount}</h3>
                  <p className="text-sm text-green-600 mt-1">
                    <ArrowUpRight size={14} className="inline mr-1" />
                    +8.2% from last month
                  </p>
                </div>
                <div className="p-2 rounded-full bg-blue-100">
                  <CreditCardIcon size={20} className="text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Pending Invoices</p>
                  <h3 className="text-2xl font-bold mt-1">{pendingCount}</h3>
                  <p className="text-sm text-yellow-600 mt-1">
                    <ArrowUpRight size={14} className="inline mr-1" />
                    +3.1% from last month
                  </p>
                </div>
                <div className="p-2 rounded-full bg-yellow-100">
                  <Wallet size={20} className="text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Refunded</p>
                  <h3 className="text-2xl font-bold mt-1">{refundedCount}</h3>
                  <p className="text-sm text-red-600 mt-1">
                    <ArrowDownRight size={14} className="inline mr-1" />
                    -2.3% from last month
                  </p>
                </div>
                <div className="p-2 rounded-full bg-red-100">
                  <Trash2 size={20} className="text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Calendar size={16} className="mr-2" />
                    {dateFilter}
                    <ChevronDown size={16} className="ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleDateFilter("Today")}>Today</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateFilter("This Week")}>This Week</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateFilter("This Month")}>This Month</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateFilter("Last 3 Months")}>Last 3 Months</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateFilter("Custom Range")}>Custom Range</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={handleMethodFilter}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Methods">All Methods</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="h-9">
                <Filter size={16} className="mr-2" /> More Filters
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search invoice or patient"
                  className="pl-8 h-9 w-[250px]"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <Button size="sm" className="h-9 bg-[#0066CC]">
                <Plus size={16} className="mr-1" /> New Invoice
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <Download size={16} className="mr-1" /> Export
              </Button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="p-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Invoice</th>
                      <th className="px-6 py-3">Patient</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3 hidden md:table-cell">Method</th>
                      <th className="px-6 py-3 hidden md:table-cell">Service</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{payment.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage
                                src={payment.patientAvatar || "/placeholder.svg"}
                                alt={payment.patientName}
                              />
                              <AvatarFallback>{payment.patientName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm font-medium text-gray-900">{payment.patientName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {payment.method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {payment.service}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(payment.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-900 mr-2"
                            onClick={() => handleViewClick(payment)}
                          >
                            <Eye size={16} className="md:mr-1" />
                            <span className="hidden md:inline">View</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-900 mr-2">
                            <Edit size={16} className="md:mr-1" />
                            <span className="hidden md:inline">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(payment.id)}
                          >
                            <Trash2 size={16} className="md:mr-1" />
                            <span className="hidden md:inline">Delete</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t border-gray-200 bg-white">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">10</span> out of <span className="font-medium">156</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-l-md"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  className="bg-blue-600 text-white"
                >
                  1
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(2)}>
                  2
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(3)}>
                  3
                </Button>
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                  ...
                </span>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)}>
                  {totalPages}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-r-md"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
              </nav>
            </div>
          </div>
        </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>Complete information about the selected invoice.</DialogDescription>
          </DialogHeader>
          {paymentToView && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-blue-600">{paymentToView.id}</h3>
                  <p className="text-sm text-gray-500">Issued on {paymentToView.date}</p>
                </div>
                <div>{renderStatusBadge(paymentToView.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Patient Information</h4>
                  <div className="mt-2 flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage
                        src={paymentToView.patientAvatar || "/placeholder.svg"}
                        alt={paymentToView.patientName}
                      />
                      <AvatarFallback>{paymentToView.patientName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{paymentToView.patientName}</p>
                      <p className="text-sm text-gray-500">Patient ID: P-{Math.floor(Math.random() * 10000)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Payment Details</h4>
                  <p className="mt-2 font-medium">{formatCurrency(paymentToView.amount)}</p>
                  <p className="text-sm text-gray-500">Method: {paymentToView.method}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Service Details</h4>
                <table className="mt-2 w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2">Service</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3">{paymentToView.service}</td>
                      <td className="px-4 py-3">Medical service provided by hospital staff</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(paymentToView.amount * 0.8)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Medication</td>
                      <td className="px-4 py-3">Prescribed medication</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(paymentToView.amount * 0.2)}</td>
                    </tr>
                    <tr className="font-medium">
                      <td className="px-4 py-3" colSpan={2}>
                        Total
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(paymentToView.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between">
                <Button variant="outline">
                  <Download size={16} className="mr-2" />
                  Download Invoice
                </Button>
                <Button>
                  <Printer size={16} className="mr-2" />
                  Print Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

// Printer component
function Printer({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  )
}
