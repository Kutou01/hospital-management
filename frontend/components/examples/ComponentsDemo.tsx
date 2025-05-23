'use client';

import React, { useState } from 'react';
import { Edit, Trash2, Eye, Plus } from 'lucide-react';
import { 
  DataTable, 
  SearchableDataTable, 
  TableSkeleton,
  LoadingSpinner,
  LoadingState,
  ErrorState,
  EmptyState,
  Column 
} from '@/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Sample data
const sampleUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Doctor', status: 'Active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Patient', status: 'Inactive' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Nurse', status: 'Active' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Doctor', status: 'Active' },
];

export function ComponentsDemo() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  // Define columns for the demo table
  const columns: Column<typeof sampleUsers[0]>[] = [
    {
      key: 'name',
      header: 'Name',
      accessor: 'name',
      className: 'font-medium',
    },
    {
      key: 'email',
      header: 'Email',
      accessor: 'email',
      className: 'text-gray-500',
    },
    {
      key: 'role',
      header: 'Role',
      accessor: (user) => (
        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (user) => (
        <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
          {user.status}
        </Badge>
      ),
    },
  ];

  // Define actions
  const actions = [
    {
      label: '',
      icon: <Eye className="h-4 w-4" />,
      onClick: (user: any) => alert(`View ${user.name}`),
      variant: 'ghost' as const,
    },
    {
      label: '',
      icon: <Edit className="h-4 w-4" />,
      onClick: (user: any) => alert(`Edit ${user.name}`),
      variant: 'ghost' as const,
    },
    {
      label: '',
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      onClick: (user: any) => alert(`Delete ${user.name}`),
      variant: 'ghost' as const,
    },
  ];

  const handleRetry = () => {
    setShowError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const getData = () => {
    if (showEmpty) return [];
    return sampleUsers;
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Components Demo</h1>
        <p className="text-gray-600 mt-2">
          Demonstration of reusable data display components
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 2000);
            }}
          >
            Show Loading
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowError(!showError)}
          >
            Toggle Error
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowEmpty(!showEmpty)}
          >
            Toggle Empty
          </Button>
        </CardContent>
      </Card>

      {/* Loading Spinners */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Spinners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <LoadingSpinner size="sm" />
            <LoadingSpinner size="md" />
            <LoadingSpinner size="lg" />
          </div>
          <LoadingState message="Loading data..." />
        </CardContent>
      </Card>

      {/* Error and Empty States */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Error State</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorState 
              message="Failed to load users" 
              onRetry={handleRetry}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empty State</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState 
              title="No users found"
              description="Add your first user to get started"
              action={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Table Skeleton</CardTitle>
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={3} columns={4} />
        </CardContent>
      </Card>

      {/* Basic DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Basic DataTable</CardTitle>
        </CardHeader>
        <CardContent>
          {showError ? (
            <ErrorState message="Failed to load data" onRetry={handleRetry} />
          ) : (
            <DataTable
              data={getData()}
              columns={columns}
              actions={actions}
              isLoading={isLoading}
              loadingMessage="Loading users..."
              emptyTitle="No users found"
              emptyDescription="There are no users to display."
              keyExtractor={(user) => user.id}
              pagination={{
                currentPage,
                totalPages: 3,
                itemsPerPage: 5,
                totalItems: getData().length,
                onPageChange: setCurrentPage,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Searchable DataTable */}
      <SearchableDataTable
        data={getData()}
        columns={columns}
        actions={actions}
        title="Searchable DataTable"
        description="DataTable with built-in search functionality"
        searchPlaceholder="Search users..."
        searchFields={['name', 'email', 'role']}
        onAdd={() => alert('Add new user')}
        addButtonLabel="Add User"
        isLoading={isLoading}
        pagination={{
          itemsPerPage: 5,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
}

export default ComponentsDemo;
