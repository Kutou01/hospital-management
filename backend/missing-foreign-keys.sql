
-- appointments → departments
ALTER TABLE appointments
ADD CONSTRAINT appointments_department_id_fkey
FOREIGN KEY (department_id) REFERENCES departments(department_id);

-- doctors → departments
ALTER TABLE doctors
ADD CONSTRAINT doctors_department_id_fkey
FOREIGN KEY (department_id) REFERENCES departments(department_id);

-- medical_records → doctors
ALTER TABLE medical_records
ADD CONSTRAINT medical_records_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- doctors → specialties
ALTER TABLE doctors
ADD CONSTRAINT doctors_specialty_id_fkey
FOREIGN KEY (specialty_id) REFERENCES specialties(specialty_id);

-- doctor_reviews → doctors
ALTER TABLE doctor_reviews
ADD CONSTRAINT doctor_reviews_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- doctor_reviews → patients
ALTER TABLE doctor_reviews
ADD CONSTRAINT doctor_reviews_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(patient_id);

-- prescriptions → patients
ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(patient_id);

-- prescriptions → doctors
ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);