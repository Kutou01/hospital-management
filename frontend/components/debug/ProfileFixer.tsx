'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProfileFixer() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    fullName: '',
    role: 'patient' as 'patient' | 'doctor' | 'admin'
  });

  const createProfile = async () => {
    if (!formData.userId || !formData.fullName) {
      setMessage('Please fill in User ID and Full Name');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      console.log('🔧 Creating profile for user:', formData.userId);

      // Create profile
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .insert([{
          id: formData.userId,
          full_name: formData.fullName,
          role: formData.role,
          phone_verified: false,
          email_verified: false,
          is_active: true
        }])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setMessage(`Profile creation failed: ${profileError.message}`);
        return;
      }

      console.log('✅ Profile created:', profileData);

      // Create role-specific profile if needed
      if (formData.role === 'patient') {
        const patientId = `PAT${Math.floor(100000 + Math.random() * 900000)}`;
        const { error: patientError } = await supabaseClient
          .from('patients')
          .insert([{
            patient_id: patientId,
            auth_user_id: formData.userId,
            full_name: formData.fullName,
            dateofbirth: '1990-01-01',
            gender: 'Male',
            address: 'Default Address',
            registration_date: new Date().toISOString().split('T')[0]
          }]);

        if (patientError) {
          console.error('Patient profile error:', patientError);
        } else {
          console.log('✅ Patient profile created');
        }
      } else if (formData.role === 'doctor') {
        const doctorId = `DOC${Math.floor(100000 + Math.random() * 900000)}`;
        const { error: doctorError } = await supabaseClient
          .from('doctors')
          .insert([{
            doctor_id: doctorId,
            auth_user_id: formData.userId,
            full_name: formData.fullName,
            specialty: 'General Medicine',
            license_number: `LIC${Math.floor(100000 + Math.random() * 900000)}`,
            gender: 'Male',
            qualification: 'MD',
            schedule: 'Mon-Fri 9AM-5PM'
          }]);

        if (doctorError) {
          console.error('Doctor profile error:', doctorError);
        } else {
          console.log('✅ Doctor profile created');
        }
      }

      setMessage(`✅ Profile created successfully for ${formData.role}!`);
      
      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error creating profile:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          userId: session.user.id
        }));
        setMessage(`Current user ID: ${session.user.id}`);
      } else {
        setMessage('No current user session found');
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      setMessage('Error getting current user');
    }
  };

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <h3 className="font-bold text-orange-800 mb-4">🔧 Profile Fixer</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="userId">User ID</Label>
            <div className="flex gap-2">
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="User ID from auth"
              />
              <Button onClick={getCurrentUser} variant="outline" size="sm">
                Get Current
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Full Name"
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value: 'patient' | 'doctor' | 'admin') => 
              setFormData(prev => ({ ...prev, role: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={createProfile} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Profile...' : 'Create Profile'}
          </Button>

          {message && (
            <div className={`text-sm p-2 rounded ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 
              message.includes('Error') ? 'bg-red-100 text-red-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
