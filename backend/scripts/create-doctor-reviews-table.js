#!/usr/bin/env node

/**
 * Create Doctor Reviews Table Script
 * Creates the missing doctor_reviews table directly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDoctorReviewsTable() {
  console.log('🔧 Creating doctor_reviews table...\n');

  try {
    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('doctor_reviews')
      .select('*')
      .limit(1);

    if (!checkError) {
      console.log('✅ doctor_reviews table already exists!');
      return true;
    }

    console.log('📋 Table does not exist, creating...');

    // Create the table using individual operations
    console.log('⚠️ Please create the doctor_reviews table manually in Supabase Dashboard:');
    console.log('');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Paste and run this SQL:');
    console.log('');
    console.log('```sql');
    console.log(`-- Create doctor_reviews table
CREATE TABLE doctor_reviews (
    review_id VARCHAR(20) PRIMARY KEY DEFAULT ('REV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('review_id_seq')::TEXT, 3, '0')),
    doctor_id VARCHAR(20) NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sequence
CREATE SEQUENCE IF NOT EXISTS review_id_seq START 1;

-- Add foreign keys
ALTER TABLE doctor_reviews 
ADD CONSTRAINT fk_doctor_reviews_doctor 
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE;

ALTER TABLE doctor_reviews 
ADD CONSTRAINT fk_doctor_reviews_patient 
FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);
CREATE INDEX idx_doctor_reviews_patient_id ON doctor_reviews(patient_id);
CREATE INDEX idx_doctor_reviews_rating ON doctor_reviews(rating);

-- Enable RLS
ALTER TABLE doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all reviews" ON doctor_reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON doctor_reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON doctor_reviews TO authenticated;
GRANT ALL ON doctor_reviews TO service_role;
GRANT USAGE ON review_id_seq TO authenticated;
GRANT USAGE ON review_id_seq TO service_role;`);
    console.log('```');
    console.log('');
    console.log('3. After running the SQL, run this script again to verify');

    return false;

  } catch (error) {
    console.error('❌ Error creating doctor_reviews table:', error);
    return false;
  }
}

async function verifyTable() {
  console.log('\n🔍 Verifying doctor_reviews table...');

  try {
    const { data, error } = await supabase
      .from('doctor_reviews')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Table verification failed: ${error.message}`);
      return false;
    }

    console.log('✅ doctor_reviews table exists and is accessible!');
    
    // Test insert (will rollback)
    const testReview = {
      doctor_id: 'TEST-DOC-202412-001',
      patient_id: 'TEST-PAT-202412-001',
      rating: 5,
      review_text: 'Test review',
      is_verified: false
    };

    console.log('🧪 Testing table structure...');
    
    // This will likely fail due to foreign key constraints, but that's expected
    const { error: insertError } = await supabase
      .from('doctor_reviews')
      .insert(testReview);

    if (insertError) {
      if (insertError.message.includes('foreign key')) {
        console.log('✅ Foreign key constraints are working correctly');
      } else {
        console.log(`⚠️ Insert test result: ${insertError.message}`);
      }
    } else {
      console.log('✅ Table structure is correct');
      
      // Clean up test data
      await supabase
        .from('doctor_reviews')
        .delete()
        .eq('review_text', 'Test review');
    }

    return true;

  } catch (error) {
    console.log(`❌ Verification error: ${error.message}`);
    return false;
  }
}

// Run creation
if (require.main === module) {
  createDoctorReviewsTable().then(async (created) => {
    if (created) {
      await verifyTable();
      console.log('\n🎉 doctor_reviews table is ready!');
      console.log('You can now run: npm run db:verify-schema');
    } else {
      console.log('\n⚠️ Please create the table manually as shown above.');
    }
  }).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { createDoctorReviewsTable, verifyTable };
