      });

      // 2. Wait for trigger to create profile automatically
      console.log('🏥 Waiting for trigger to create profile for auth user:', authData.user.id);

      // Wait a bit for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify profile was created by trigger
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id, email, full_name, role, phone_number, created_at')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Profile not created by trigger:', profileError);
        return { user: null, session: null, error: 'Không thể tạo hồ sơ người dùng. Vui lòng thử lại.' };
      }

      console.log('✅ Profile created by trigger:', profileData);