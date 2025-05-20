"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  User,
  UserCog,
  Settings2,
  FileBarChart,
  Plus,
  Edit,
  Trash2,
  Filter,
  CreditCard,
  Building2,
  BedDouble,
  CheckCircle2,
  XCircle,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { roomsApi, departmentsApi } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [currentPage, setCurrentPage] = useState(1)
  const [isNewRoomDialogOpen, setIsNewRoomDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [roomToEdit, setRoomToEdit] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])

  // Sample rooms data for fallback
  const roomsData = [
    { id: "RM101", number: "101", type: "Ward", department: "General Medicine", capacity: 4, status: "Occupied", equipment: "Basic" },
    { id: "RM102", number: "102", type: "Ward", department: "General Medicine", capacity: 4, status: "Available", equipment: "Basic" },
    { id: "RM103", number: "103", type: "Private", department: "Cardiology", capacity: 1, status: "Occupied", equipment: "Advanced" },
    { id: "RM104", number: "104", type: "Private", department: "Cardiology", capacity: 1, status: "Available", equipment: "Advanced" },
    { id: "RM105", number: "105", type: "ICU", department: "Critical Care", capacity: 1, status: "Occupied", equipment: "Specialized" },
    { id: "RM201", number: "201", type: "Ward", department: "Pediatrics", capacity: 4, status: "Occupied", equipment: "Basic" },
    { id: "RM202", number: "202", type: "Private", department: "Pediatrics", capacity: 1, status: "Available", equipment: "Advanced" },
    { id: "RM203", number: "203", type: "Operating", department: "Surgery", capacity: 0, status: "Available", equipment: "Specialized" },
    { id: "RM204", number: "204", type: "Operating", department: "Surgery", capacity: 0, status: "Maintenance", equipment: "Specialized" },
    { id: "RM301", number: "301", type: "Ward", department: "Orthopedics", capacity: 4, status: "Occupied", equipment: "Basic" },
    { id: "RM302", number: "302", type: "Private", department: "Orthopedics", capacity: 1, status: "Available", equipment: "Advanced" },
    { id: "RM303", number: "303", type: "Examination", department: "Neurology", capacity: 0, status: "Available", equipment: "Advanced" },
  ]

  const [rooms, setRooms] = useState<any[]>([])
  const [newRoom, setNewRoom] = useState({
    room_id: 0,
    room_number: "",
    department_id: 0,
    room_type: "Ward",
    capacity: 0,
    status: "Available",
    equipment: "Basic"
  })

  // Lấy dữ liệu phòng và phòng ban từ Supabase khi component được tải
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Lấy dữ liệu phòng
        const roomsData = await roomsApi.getAllRooms();

        // Lấy dữ liệu phòng ban
        const departmentsData = await departmentsApi.getAllDepartments();
        setDepartments(departmentsData);

        // Transform data to match the UI format
        const formattedRooms = roomsData.map(room => {
          // Find department name
          const department = departmentsData.find(
            dept => dept.department_id === room.department_id
          );

          return {
            id: `RM${String(room.room_id).padStart(3, '0')}`,
            number: room.room_number,
            type: room.room_type,
            department: department ? department.department_name : `Department ${room.department_id}`,
            capacity: room.capacity,
            status: room.status,
            equipment: room.equipment || "Basic",
            // Keep original data
            room_id: room.room_id,
            department_id: room.department_id
          };
        });

        setRooms(formattedRooms);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Sử dụng dữ liệu mẫu nếu có lỗi khi lấy dữ liệu từ Supabase
        setRooms(roomsData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const roomsPerPage = 10
  const totalPages = Math.ceil(rooms.length / roomsPerPage)

  // Room types and statuses for filters
  const roomTypes = ["All Types", "Ward", "Private", "ICU", "Operating", "Examination"]
  const roomStatuses = ["All Status", "Available", "Occupied", "Maintenance"]

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Handle new room form
  const handleNewRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewRoom({
      ...newRoom,
      [name]: name === 'capacity' || name === 'room_id' || name === 'department_id' ? parseInt(value) : value,
    })
  }

  const handleNewRoomSelectChange = (name: string, value: string) => {
    setNewRoom({
      ...newRoom,
      [name]: value,
    })
  }

  const handleAddNewRoom = async () => {
    try {
      // Prepare room data for Supabase
      const roomData = {
        room_number: newRoom.room_number,
        room_type: newRoom.room_type,
        department_id: newRoom.department_id,
        capacity: newRoom.capacity,
        status: newRoom.status,
        equipment: newRoom.equipment
      };

      // Add room to database
      const newRoomData = await roomsApi.addRoom(roomData);

      if (newRoomData) {
        // Find department name
        const department = departments.find(
          dept => dept.department_id === newRoomData.department_id
        );

        // Format for UI display
        const roomWithId = {
          id: `RM${String(newRoomData.room_id).padStart(3, '0')}`,
          room_id: newRoomData.room_id,
          number: newRoomData.room_number,
          type: newRoomData.room_type,
          department: department ? department.department_name : `Department ${newRoomData.department_id}`,
          capacity: newRoomData.capacity,
          status: newRoomData.status,
          equipment: newRoomData.equipment || "Basic",
          department_id: newRoomData.department_id
        };

        // Update state with new room
        setRooms([...rooms, roomWithId]);
        console.log('Room added successfully!');
      }
    } catch (error) {
      console.error('Error adding room:', error);
      // Fallback to client-side only update if API fails
      const roomWithId = {
        id: `RM${String(rooms.length + 1).padStart(3, '0')}`,
        room_id: newRoom.room_id || Math.floor(Math.random() * 10000),
        number: newRoom.room_number,
        type: newRoom.room_type,
        department: `Department ${newRoom.department_id}`,
        capacity: newRoom.capacity,
        status: newRoom.status,
        equipment: newRoom.equipment
      };
      setRooms([...rooms, roomWithId]);
    } finally {
      // Reset form
      setNewRoom({
        room_id: 0,
        room_number: "",
        department_id: 0,
        room_type: "Ward",
        capacity: 0,
        status: "Available",
        equipment: "Basic"
      });
      setIsNewRoomDialogOpen(false);
    }
  }

  // Handle delete room
  const handleDeleteClick = (id: string) => {
    setRoomToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (roomToDelete) {
      try {
        // Find the room to delete
        const roomToDeleteObj = rooms.find(room => room.id === roomToDelete);

        if (roomToDeleteObj && roomToDeleteObj.room_id) {
          // Delete from database
          const success = await roomsApi.deleteRoom(roomToDeleteObj.room_id);

          if (success) {
            console.log('Room deleted successfully from database');
          } else {
            console.error('Failed to delete room from database');
          }
        }
      } catch (error) {
        console.error('Error deleting room:', error);
      } finally {
        // Update UI regardless of API success (optimistic UI update)
        setRooms(rooms.filter((room) => room.id !== roomToDelete));
        setRoomToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  }

  // Handle edit room
  const handleEditClick = (room: any) => {
    setRoomToEdit({ ...room })
    setIsEditDialogOpen(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRoomToEdit({
      ...roomToEdit,
      [name]: name === 'capacity' || name === 'department_id' ? parseInt(value) : value,
    })
  }

  const handleEditSelectChange = (name: string, value: string) => {
    setRoomToEdit({
      ...roomToEdit,
      [name]: value,
    })
  }

  const handleSaveEdit = async () => {
    try {
      if (roomToEdit && roomToEdit.room_id) {
        // Prepare room data for Supabase
        const roomData = {
          room_number: roomToEdit.number,
          room_type: roomToEdit.type,
          department_id: roomToEdit.department_id,
          capacity: roomToEdit.capacity,
          status: roomToEdit.status,
          equipment: roomToEdit.equipment
        };

        // Update room in database
        const updatedRoom = await roomsApi.updateRoom(roomToEdit.room_id, roomData);

        if (updatedRoom) {
          console.log('Room updated successfully in database');
        } else {
          console.error('Failed to update room in database');
        }
      }
    } catch (error) {
      console.error('Error updating room:', error);
    } finally {
      // Update UI regardless of API success (optimistic UI update)
      setRooms(
        rooms.map((room) => (room.id === roomToEdit.id ? roomToEdit : room))
      );
      setRoomToEdit(null);
      setIsEditDialogOpen(false);
    }
  }

  // Filter rooms based on search term and filters
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "All Types" || room.type === typeFilter
    const matchesStatus = statusFilter === "All Status" || room.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  // Get current page rooms
  const indexOfLastRoom = currentPage * roomsPerPage
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage
  const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom)

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
      case "Occupied":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Occupied</Badge>
      case "Maintenance":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Maintenance</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-4 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#0066CC] flex items-center justify-center">
            <span className="text-white font-bold">H</span>
          </div>
          <span className="text-xl font-bold">Hospital</span>
        </div>
        <div className="mt-6">
          <SidebarItem icon={<BarChart3 size={20} />} label="Dashboard" href="/admin/dashboard" />
          <SidebarItem icon={<Calendar size={20} />} label="Appointments" href="/admin/appointments" />
          <SidebarItem icon={<UserCog size={20} />} label="Doctors" href="/admin/doctors" />
          <SidebarItem icon={<User size={20} />} label="Patients" href="/admin/patients" />
          <SidebarItem icon={<Building2 size={20} />} label="Departments" href="/admin/departments" />
          <SidebarItem icon={<BedDouble size={20} />} label="Rooms" href="/admin/rooms" active />
          <SidebarItem icon={<CreditCard size={20} />} label="Payment" href="/admin/payment" />
          <SidebarItem icon={<Settings2 size={20} />} label="Settings" href="/admin/settings" />
          <SidebarItem icon={<FileBarChart size={20} />} label="Audit Logs" href="/admin/audit-logs" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
              <MenuIcon size={20} />
            </Button>
            <h1 className="text-xl font-bold">Rooms</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
                <AvatarFallback>AW</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <span className="font-medium">Admin User</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4">
          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search rooms..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Room Type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {roomStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsNewRoomDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Room
            </Button>
          </div>

          {/* Rooms Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading rooms...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-3">Room ID</th>
                        <th className="px-6 py-3">Room Number</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Capacity</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Equipment</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentRooms.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                            No rooms found. Add a new room to get started.
                          </td>
                        </tr>
                      ) : (
                        currentRooms.map((room) => (
                          <tr key={room.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium">{room.id}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium">{room.number}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{room.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{room.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {room.capacity > 0 ? room.capacity : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(room.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{room.equipment}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(room)}>
                                <Edit size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(room.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstRoom + 1} to{" "}
              {Math.min(indexOfLastRoom, filteredRooms.length)} of{" "}
              {filteredRooms.length} rooms
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Room Dialog */}
      <Dialog open={isNewRoomDialogOpen} onOpenChange={setIsNewRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Enter the details for the new room.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_id" className="text-right">
                Room ID
              </Label>
              <Input
                id="room_id"
                name="room_id"
                type="number"
                value={newRoom.room_id}
                onChange={handleNewRoomChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_number" className="text-right">
                Room Number
              </Label>
              <Input
                id="room_number"
                name="room_number"
                value={newRoom.room_number}
                onChange={handleNewRoomChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_type" className="text-right">
                Type
              </Label>
              <Select
                value={newRoom.room_type}
                onValueChange={(value) => handleNewRoomSelectChange("room_type", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.slice(1).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department_id" className="text-right">
                Department
              </Label>
              <Select
                value={newRoom.department_id?.toString() || ""}
                onValueChange={(value) => handleNewRoomSelectChange("department_id", parseInt(value))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={newRoom.capacity}
                onChange={handleNewRoomChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={newRoom.status}
                onValueChange={(value) => handleNewRoomSelectChange("status", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {roomStatuses.slice(1).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRoomDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewRoom}>
              Add Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update the room details.
            </DialogDescription>
          </DialogHeader>
          {roomToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-roomid" className="text-right">
                  Room ID
                </Label>
                <Input
                  id="edit-roomid"
                  name="roomid"
                  type="number"
                  value={roomToEdit.roomid}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-number" className="text-right">
                  Room Number
                </Label>
                <Input
                  id="edit-number"
                  name="number"
                  value={roomToEdit.number}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">
                  Type
                </Label>
                <Select
                  value={roomToEdit.type}
                  onValueChange={(value) => handleEditSelectChange("type", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.slice(1).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-department_id" className="text-right">
                  Department
                </Label>
                <Select
                  value={roomToEdit.department_id?.toString() || ""}
                  onValueChange={(value) => handleEditSelectChange("department_id", parseInt(value))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="edit-capacity"
                  name="capacity"
                  type="number"
                  value={roomToEdit.capacity}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <Select
                  value={roomToEdit.status}
                  onValueChange={(value) => handleEditSelectChange("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomStatuses.slice(1).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this room? This action cannot be undone.
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
    </div>
  )
}

// Component for sidebar items
function SidebarItem({ icon, label, href, active = false }) {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-3 space-x-3 ${active ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  )
}

// MenuIcon component for mobile
function MenuIcon({ size }) {
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
    >
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  )
}
