-- FOREIGN KEYS THAT CAN BE CREATED IMMEDIATELY
-- These relationships work because the required columns already exist

-- medical_records → doctors
-- (medical_records.doctor_id already exists)
ALTER TABLE medical_records
ADD CONSTRAINT medical_records_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- doctor_reviews → doctors  
-- (doctor_reviews.doctor_id already exists)
ALTER TABLE doctor_reviews
ADD CONSTRAINT doctor_reviews_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- doctor_reviews → patients
-- (doctor_reviews.patient_id already exists)
ALTER TABLE doctor_reviews
ADD CONSTRAINT doctor_reviews_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(patient_id);
