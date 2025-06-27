
-- appointments → rooms (MEDIUM)
ALTER TABLE appointments
ADD CONSTRAINT appointments_room_id_fkey
FOREIGN KEY (room_id) REFERENCES rooms(room_id);

-- doctors → departments (HIGH)
ALTER TABLE doctors
ADD CONSTRAINT doctors_department_id_fkey
FOREIGN KEY (department_id) REFERENCES departments(department_id);

-- rooms → departments (MEDIUM)
ALTER TABLE rooms
ADD CONSTRAINT rooms_department_id_fkey
FOREIGN KEY (department_id) REFERENCES departments(department_id);