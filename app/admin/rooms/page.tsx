"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { roomsApi, departmentsApi } from "@/lib/supabase"

// Shared components
import { AdminLayout } from "@/components/layout/AdminLayout"
import { StatusBadge } from "@/components/data-display/StatusBadge"
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator"
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog"

// UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/toast-provider"

export default function RoomsPage() {
  // State variables
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [currentPage, setCurrentPage] = useState(1)
  const [isNewRoomDialogOpen, setIsNewRoomDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [roomToEdit, setRoomToEdit] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])

  // Toast notifications
  const { showToast } = useToast()
  const [newRoom, setNewRoom] = useState({
    room_number: "",
    department_id: "",
    room_type: "Ward",
    capacity: 0,
    status: "Available"
  })

  // Room types and statuses for filters
  const roomTypes = ["All Types", "Ward", "Private", "ICU", "Operating", "Examination"]
  const roomStatuses = ["All Status", "Available", "Occupied", "Maintenance"]
  const roomsPerPage = 10

  // Fetch rooms and departments data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get rooms data
        const roomsData = await roomsApi.getAllRooms();

        // Get departments data
        const departmentsData = await departmentsApi.getAllDepartments();
        setDepartments(departmentsData);

        // Transform data to match the UI format
        const formattedRooms = roomsData.map(room => {
          // Find department name
          const department = departmentsData.find(
            dept => dept.department_id === room.department_id
          );

          return {
            id: room.room_id,
            number: room.room_number,
            type: room.room_type,
            department: department ? department.department_name : `Department ${room.department_id}`,
            capacity: room.capacity,
            status: room.status,
            department_id: room.department_id
          };
        });

        setRooms(formattedRooms);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use sample data if there's an error
        setRooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter rooms based on search term and filters
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      (room.number && room.number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (room.department && room.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "All Types" || room.type === typeFilter;
    const matchesStatus = statusFilter === "All Status" || room.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle new room form
  const handleNewRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRoom({
      ...newRoom,
      [name]: name === 'capacity' ? parseInt(value) : value,
    });
  };

  const handleNewRoomSelectChange = (name: string, value: string) => {
    setNewRoom({
      ...newRoom,
      [name]: value,
    });
  };

  // Add new room
  const handleAddNewRoom = async () => {
    try {
      // Validate required fields
      if (!newRoom.room_number) {
        showToast("Room number is required", undefined, "error");
        return;
      }

      if (!newRoom.department_id) {
        showToast("Department is required", undefined, "error");
        return;
      }

      // Prepare room data for Supabase
      const roomData = {
        room_number: newRoom.room_number,
        room_type: newRoom.room_type,
        department_id: newRoom.department_id,
        capacity: newRoom.capacity,
        status: newRoom.status
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
          id: newRoomData.room_id,
          number: newRoomData.room_number,
          type: newRoomData.room_type,
          department: department ? department.department_name : `Department ${newRoomData.department_id}`,
          capacity: newRoomData.capacity,
          status: newRoomData.status,
          department_id: newRoomData.department_id
        };

        // Update state with new room
        setRooms([...rooms, roomWithId]);

        // Show success toast
        showToast("Room added successfully", "The room has been added to the system.", "success");

        // Reset form and close dialog
        setNewRoom({
          room_number: "",
          department_id: "",
          room_type: "Ward",
          capacity: 0,
          status: "Available"
        });
        setIsNewRoomDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding room:', error);
      showToast("Error adding room", error instanceof Error ? error.message : "An unknown error occurred", "error");
    }
  };

  // Delete room
  const handleDeleteClick = (roomId: string) => {
    setRoomToDelete(roomId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (roomToDelete) {
      try {
        // Delete from database
        const success = await roomsApi.deleteRoom(roomToDelete);

        if (success) {
          // Update UI
          setRooms(rooms.filter((room) => room.id !== roomToDelete));

          // Show success toast
          showToast("Room deleted successfully", "The room has been removed from the system.", "success");
        }
      } catch (error) {
        console.error('Error deleting room:', error);
        showToast("Error deleting room", error instanceof Error ? error.message : "An unknown error occurred", "error");
      } finally {
        setRoomToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  // Edit room
  const handleEditClick = (room: any) => {
    setRoomToEdit({ ...room });
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoomToEdit({
      ...roomToEdit,
      [name]: name === 'capacity' ? parseInt(value) : value,
    });
  };

  const handleEditSelectChange = (name: string, value: string) => {
    setRoomToEdit({
      ...roomToEdit,
      [name]: value,
    });
  };

  const handleSaveEdit = async () => {
    try {
      if (roomToEdit) {
        // Validate required fields
        if (!roomToEdit.number) {
          showToast("Room number is required", undefined, "error");
          return;
        }

        if (!roomToEdit.department_id) {
          showToast("Department is required", undefined, "error");
          return;
        }

        // Prepare room data for Supabase
        const roomData = {
          room_number: roomToEdit.number,
          room_type: roomToEdit.type,
          department_id: roomToEdit.department_id,
          capacity: roomToEdit.capacity,
          status: roomToEdit.status
        };

        // Update room in database
        const updatedRoom = await roomsApi.updateRoom(roomToEdit.id, roomData);

        if (updatedRoom) {
          // Find department name
          const department = departments.find(
            dept => dept.department_id === updatedRoom.department_id
          );

          // Update rooms state
          setRooms(
            rooms.map((room) =>
              room.id === roomToEdit.id
                ? {
                    ...room,
                    number: updatedRoom.room_number,
                    type: updatedRoom.room_type,
                    department: department ? department.department_name : `Department ${updatedRoom.department_id}`,
                    capacity: updatedRoom.capacity,
                    status: updatedRoom.status,
                    department_id: updatedRoom.department_id
                  }
                : room
            )
          );

          // Show success toast
          showToast("Room updated successfully", "The room information has been updated.", "success");

          // Close dialog
          setRoomToEdit(null);
          setIsEditDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error updating room:', error);
      showToast("Error updating room", error instanceof Error ? error.message : "An unknown error occurred", "error");
    }
  };

  return (
    <AdminLayout title="Rooms" activePage="rooms">
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
            <LoadingIndicator size="medium" text="Loading rooms..." fullWidth={true} />
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
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRooms
                    .slice((currentPage - 1) * roomsPerPage, currentPage * roomsPerPage)
                    .map((room) => (
                      <tr key={room.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{room.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{room.number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{room.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{room.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{room.capacity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={room.status} type="room" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(room)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(room.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{Math.min(filteredRooms.length, (currentPage - 1) * roomsPerPage + 1)}</span> to{" "}
          <span className="font-medium">{Math.min(filteredRooms.length, currentPage * roomsPerPage)}</span> of{" "}
          <span className="font-medium">{filteredRooms.length}</span> rooms
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>
            Next
          </Button>
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
                Room Type
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
                value={newRoom.department_id}
                onValueChange={(value) => handleNewRoomSelectChange("department_id", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.department_id} value={dept.department_id}>
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
            <Button onClick={handleAddNewRoom}>Add Room</Button>
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
                <Label htmlFor="number" className="text-right">
                  Room Number
                </Label>
                <Input
                  id="number"
                  name="number"
                  value={roomToEdit.number}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Room Type
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
                <Label htmlFor="department_id" className="text-right">
                  Department
                </Label>
                <Select
                  value={roomToEdit.department_id}
                  onValueChange={(value) => handleEditSelectChange("department_id", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.department_id} value={dept.department_id}>
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
                  value={roomToEdit.capacity}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
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
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Room"
        description="Are you sure you want to delete this room? This action cannot be undone."
      />
    </AdminLayout>
  )
}
