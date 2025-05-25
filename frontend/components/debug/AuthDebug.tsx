'use client';

import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import { Card, CardContent } from '@/components/ui/card';

export function AuthDebug() {
  const { user, session, loading } = useSupabaseAuth();

  return (
    <Card className="mt-4 border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <h3 className="font-bold text-yellow-800 mb-2">🐛 Auth Debug Info</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Has Session:</strong> {session ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Has User:</strong> {user ? 'Yes' : 'No'}
          </div>
          {user && (
            <div className="space-y-1">
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Role:</strong> {user.role}</div>
              <div><strong>Full Name:</strong> {user.full_name}</div>
              <div><strong>Is Active:</strong> {user.is_active ? 'Yes' : 'No'}</div>
            </div>
          )}
          {session && (
            <div className="space-y-1">
              <div><strong>Session User ID:</strong> {session.user.id}</div>
              <div><strong>Session Email:</strong> {session.user.email}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
