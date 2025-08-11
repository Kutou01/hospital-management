"use client";

import { PatientLayout } from "@/components/layout/UniversalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppointmentBookingModal } from "@/components/patient/AppointmentBookingModal";
import { appointmentsApi, patientsApi } from "@/lib/api";
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  Search,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Appointment {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  status: string;
  reason: string;
  notes?: string;
  consultation_fee: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  // Extended fields from API joins
  doctor_name?: string;
  doctor_specialization?: string;
  patient_name?: string;
  // Legacy fields for backward compatibility
  appointment_time?: string;
  treatment_description?: string;
}

export default function PatientAppointments() {
  const { user, loading } = useEnhancedAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Get patient ID when user is loaded
  useEffect(() => {
    if (user && user.role === "patient" && user.profile_id) {
      loadPatientProfile();
    }
  }, [user]);

  const loadPatientProfile = async () => {
    try {
      if (!user?.profile_id) return;

      const response = await patientsApi.getByProfileId(user.profile_id);
      if (response.success && response.data) {
        setPatientId(response.data.patient_id);
        loadAppointments(response.data.patient_id);
      } else {
        toast.error("Không thể tải thông tin bệnh nhân");
      }
    } catch (error) {
      console.error("Error loading patient profile:", error);
      toast.error("Lỗi khi tải thông tin bệnh nhân");
    }
  };

  const loadAppointments = async (patientIdParam: string) => {
    try {
      setIsLoadingAppointments(true);
      const response = await appointmentsApi.getByPatientId(patientIdParam);

      if (response.success && response.data) {
        setAppointments(response.data);
      } else {
        toast.error("Không thể tải danh sách lịch hẹn");
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast.error("Lỗi khi tải danh sách lịch hẹn");
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Mock data removed - now using real API data

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const confirmed = window.confirm(
        "Bạn có chắc chắn muốn hủy lịch hẹn này không?"
      );
      if (!confirmed) return;

      const response = await appointmentsApi.updateStatus(
        appointmentId,
        "cancelled"
      );

      if (response.success) {
        toast.success("Đã hủy lịch hẹn thành công");
        // Reload appointments to reflect changes
        if (patientId) {
          loadAppointments(patientId);
        }
      } else {
        toast.error("Không thể hủy lịch hẹn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Lỗi khi hủy lịch hẹn");
    }
  };

  // Handle appointment rescheduling (placeholder for now)
  const handleRescheduleAppointment = async (appointmentId: string) => {
    // For now, show a message that this feature is coming soon
    toast.info(
      "Tính năng đổi lịch hẹn sẽ được cập nhật sớm. Vui lòng liên hệ bệnh viện để đổi lịch."
    );
  };

  // Handle opening booking modal
  const handleOpenBookingModal = () => {
    if (!patientId) {
      toast.error("Không thể xác định thông tin bệnh nhân");
      return;
    }
    setIsBookingModalOpen(true);
  };

  // Handle appointment booked successfully
  const handleAppointmentBooked = () => {
    if (patientId) {
      loadAppointments(patientId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      (appointment.doctor_name &&
        appointment.doctor_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (appointment.treatment_description &&
        appointment.treatment_description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (appointment.doctor_specialization &&
        appointment.doctor_specialization
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    const matchesFilter =
      filterStatus === "all" ||
      appointment.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Sort appointments by date and time
  const sortedAppointments = filteredAppointments.sort((a, b) => {
    const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
    const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
    return dateA.getTime() - dateB.getTime();
  });

  if (loading || isLoadingAppointments) {
    return (
      <PatientLayout title="My Appointments" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  if (!user || user.role !== "patient") {
    return (
      <PatientLayout title="My Appointments" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Access denied. Patient role required.
            </p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="My Appointments" activePage="appointments">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              My Appointments
            </h2>
            <p className="text-gray-600">
              View and manage your medical appointments
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleOpenBookingModal}
          >
            <Plus className="h-4 w-4 mr-2" />
            Book New Appointment
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search doctors, specializations, or appointment types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter appointments by status"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {sortedAppointments.map((appointment) => (
          <Card
            key={appointment.appointment_id}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold">
                        {appointment.doctor_name || "Bác sĩ chưa xác định"}
                      </h3>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1 capitalize">
                        {appointment.status}
                      </span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {appointment.appointment_date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {appointment.start_time && appointment.end_time
                          ? `${appointment.start_time} - ${appointment.end_time}`
                          : appointment.appointment_time || "Chưa xác định"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Phòng khám</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {appointment.doctor_specialization ||
                          "Chuyên khoa chưa xác định"}
                      </span>
                      <span className="text-sm text-gray-500">
                        • Bệnh viện Đa khoa
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Lý do khám:{" "}
                      {appointment.reason ||
                        appointment.treatment_description ||
                        "Khám tổng quát"}
                    </p>
                    {appointment.appointment_type && (
                      <p className="text-sm text-gray-600">
                        Loại hẹn:{" "}
                        {appointment.appointment_type === "consultation"
                          ? "Khám tư vấn"
                          : appointment.appointment_type === "follow_up"
                          ? "Tái khám"
                          : appointment.appointment_type === "emergency"
                          ? "Cấp cứu"
                          : appointment.appointment_type === "routine_checkup"
                          ? "Khám định kỳ"
                          : appointment.appointment_type}
                      </p>
                    )}
                    {appointment.consultation_fee && (
                      <p className="text-sm text-gray-600">
                        Phí khám:{" "}
                        {appointment.consultation_fee.toLocaleString("vi-VN")}{" "}
                        VNĐ
                        {appointment.payment_status && (
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              appointment.payment_status === "paid"
                                ? "bg-green-100 text-green-800"
                                : appointment.payment_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {appointment.payment_status === "paid"
                              ? "Đã thanh toán"
                              : appointment.payment_status === "pending"
                              ? "Chờ thanh toán"
                              : appointment.payment_status === "refunded"
                              ? "Đã hoàn tiền"
                              : "Thất bại"}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Ngày tạo:{" "}
                      {new Date(appointment.created_at).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {appointment.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() =>
                        handleCancelAppointment(appointment.appointment_id)
                      }
                    >
                      Cancel
                    </Button>
                  )}
                  {appointment.status === "confirmed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      onClick={() =>
                        handleRescheduleAppointment(appointment.appointment_id)
                      }
                    >
                      Reschedule
                    </Button>
                  )}
                  {appointment.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      View Report
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedAppointments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "You don't have any appointments scheduled yet"}
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleOpenBookingModal}
              >
                <Plus className="h-4 w-4 mr-2" />
                Book Your First Appointment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Appointment Booking Modal */}
      {patientId && (
        <AppointmentBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          patientId={patientId}
          onAppointmentBooked={handleAppointmentBooked}
        />
      )}
    </PatientLayout>
  );
}
