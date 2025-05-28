-- Create Rooms Table for Hospital Management System
-- This script creates the missing rooms table that is referenced in the application

-- Drop existing rooms table if it exists
DROP TABLE IF EXISTS rooms CASCADE;

-- Create rooms table
CREATE TABLE rooms (
  room_id TEXT PRIMARY KEY DEFAULT ('ROOM' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('consultation', 'surgery', 'emergency', 'ward', 'icu', 'laboratory', 'Phòng khám', 'Phòng mổ', 'Phòng bệnh', 'Phòng hồi sức')),
  department_id TEXT NOT NULL REFERENCES departments(department_id),
  capacity INTEGER DEFAULT 1 CHECK (capacity > 0),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'out_of_service')),
  equipment JSONB DEFAULT '[]',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_rooms_department_id ON rooms(department_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_room_number ON rooms(room_number);

-- Enable RLS for rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Everyone can view available rooms" ON rooms
  FOR SELECT USING (status = 'available');

CREATE POLICY "Admins can manage all rooms" ON rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Doctors can view rooms in their department" ON rooms
  FOR SELECT USING (
    department_id IN (
      SELECT department_id FROM doctors WHERE profile_id = auth.uid()
    )
  );

-- Insert some sample rooms data
INSERT INTO rooms (room_id, room_number, department_id, room_type, capacity, status) VALUES
-- General Medicine Department (DEPT001)
('ROOM001', '101', 'DEPT001', 'Phòng khám', 1, 'available'),
('ROOM002', '102', 'DEPT001', 'Phòng khám', 1, 'available'),
('ROOM003', '103', 'DEPT001', 'Phòng bệnh', 4, 'available'),
('ROOM004', '104', 'DEPT001', 'Phòng bệnh', 2, 'occupied'),
-- Cardiology Department (DEPT002)
('ROOM005', '201', 'DEPT002', 'Phòng khám', 1, 'available'),
('ROOM006', '202', 'DEPT002', 'Phòng khám', 1, 'occupied'),
('ROOM007', '203', 'DEPT002', 'Phòng mổ', 1, 'available'),
('ROOM008', '204', 'DEPT002', 'Phòng hồi sức', 2, 'available'),
-- Pediatrics Department (DEPT003)
('ROOM009', '301', 'DEPT003', 'Phòng khám', 1, 'available'),
('ROOM010', '302', 'DEPT003', 'Phòng khám', 1, 'available'),
('ROOM011', '303', 'DEPT003', 'Phòng bệnh', 2, 'available'),
-- Orthopedics Department (DEPT004)
('ROOM012', '401', 'DEPT004', 'Phòng khám', 1, 'available'),
('ROOM013', '402', 'DEPT004', 'Phòng mổ', 1, 'available'),
-- Emergency Department (DEPT005)
('ROOM014', '501', 'DEPT005', 'Phòng khám', 1, 'available'),
('ROOM015', '502', 'DEPT005', 'Phòng hồi sức', 1, 'available')
ON CONFLICT (room_id) DO NOTHING;

SELECT 'Rooms table created successfully with sample data!' as status;
