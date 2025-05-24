# 🏥 Frontend Microservices Integration Guide

## 🎯 Overview

This guide explains how to use the newly integrated frontend with the hospital management microservices. The frontend now connects to 3 production-ready microservices:

- **Medical Records Service** (Port 3006)
- **Prescription Service** (Port 3007)
- **Billing Service** (Port 3008)

## 🚀 Quick Start

### 1. Start All Microservices

**Windows (PowerShell):**
```powershell
.\scripts\start-microservices.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/start-microservices.sh
./scripts/start-microservices.sh
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Access the Application

- **Frontend:** http://localhost:3001
- **Microservices Test Page:** http://localhost:3001/admin/microservices

## 📋 Available Features

### 🔍 Health Check Dashboard (`/admin/microservices`)
- Real-time service status monitoring
- Response time tracking
- Error reporting
- Quick service testing

### 📊 Complete Management Pages

#### 🏥 Medical Records Page (`/admin/medical-records`)
- **Statistics Dashboard**: Total records, active records, recent activity
- **Analytics**: Monthly trends, top diagnoses
- **Data Management**: View, create, edit, delete medical records
- **Lab Results**: Manage lab test results and vital signs
- **Patient/Doctor Filtering**: Filter records by specific patients or doctors

#### 💊 Prescription Management (`/admin/prescriptions`)
- **Prescription Analytics**: Total prescriptions, pending/dispensed status
- **Revenue Tracking**: Cost calculations and revenue analytics
- **Medication Database**: Search and manage medications
- **Drug Interactions**: Check for medication conflicts
- **Status Management**: Track prescription lifecycle
- **Top Medications**: Analytics on most prescribed drugs

#### 💳 Billing & Payments (`/admin/billing`)
- **Financial Dashboard**: Total revenue, pending amounts, overdue bills
- **Payment Analytics**: Payment methods breakdown, collection efficiency
- **Bill Management**: Create, edit, delete bills
- **Payment Processing**: Stripe integration ready
- **Insurance Handling**: Insurance coverage tracking
- **Revenue Trends**: Monthly revenue analysis

#### 📈 Analytics Dashboard (`/admin/microservices-dashboard`)
- **Real-time Microservices Health**: Live status of all services
- **Cross-service Analytics**: Combined data from all microservices
- **Monthly Trends**: 6-month trend analysis across all services
- **Key Metrics**: Unified view of medical records, prescriptions, and billing
- **Quick Actions**: Direct links to management functions

## 🛠️ API Integration

### API Client Configuration

The frontend uses a centralized API client that:
- Handles authentication tokens
- Manages request/response formatting
- Provides error handling
- Supports file uploads

```typescript
import { medicalRecordsApi, prescriptionsApi, billingApi } from '@/lib/api';

// Example usage
const records = await medicalRecordsApi.getAllMedicalRecords();
const prescriptions = await prescriptionsApi.getPrescriptionsByPatientId(patientId);
const bills = await billingApi.getBillsByPatientId(patientId);
```

### Environment Configuration

Copy and configure environment variables:

```bash
cp frontend/.env.example frontend/.env.local
```

Key variables:
```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3100
NEXT_PUBLIC_USE_MICROSERVICES_MEDICAL_RECORDS=true
NEXT_PUBLIC_USE_MICROSERVICES_PRESCRIPTIONS=true
NEXT_PUBLIC_USE_MICROSERVICES_BILLING=true
```

## 🧪 Testing the Integration

### 1. Health Check
Visit `/admin/microservices` to verify all services are running.

### 2. API Testing
Use the built-in tables to test CRUD operations:
- Create new records
- View existing data
- Edit and update
- Delete records

### 3. Error Handling
The frontend gracefully handles:
- Service unavailability
- Network errors
- Authentication issues
- Validation errors

## 📁 File Structure

```
frontend/
├── lib/api/
│   ├── client.ts              # Main API client
│   ├── medical-records.ts     # Medical records API
│   ├── prescriptions.ts       # Prescriptions API
│   ├── billing.ts             # Billing API
│   └── index.ts               # API exports
├── components/features/
│   ├── medical-records/       # Medical records components
│   ├── prescriptions/         # Prescription components
│   └── billing/               # Billing components
├── components/test/
│   └── MicroservicesHealthCheck.tsx
└── app/admin/microservices/
    └── page.tsx               # Test page
```

## 🔧 Development Tips

### Adding New API Endpoints

1. **Add to API client:**
```typescript
// lib/api/medical-records.ts
export const medicalRecordsApi = {
  // ... existing methods
  newMethod: async (data: any): Promise<ApiResponse<any>> => {
    return apiClient.post('/medical-records/new-endpoint', data);
  },
};
```

2. **Use in components:**
```typescript
import { medicalRecordsApi } from '@/lib/api';

const handleNewAction = async () => {
  const response = await medicalRecordsApi.newMethod(data);
  if (response.success) {
    // Handle success
  } else {
    // Handle error
  }
};
```

### Error Handling Pattern

```typescript
import { handleApiError, isApiSuccess } from '@/lib/api';

const fetchData = async () => {
  try {
    const response = await medicalRecordsApi.getAllMedicalRecords();

    if (isApiSuccess(response)) {
      setData(response.data);
    } else {
      setError(handleApiError(response.error));
    }
  } catch (error) {
    setError('Network error occurred');
  }
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Services not starting:**
   - Check if ports are available
   - Verify Node.js version (18+)
   - Install dependencies: `npm install`

2. **CORS errors:**
   - Ensure API Gateway is running
   - Check CORS configuration in services

3. **Authentication errors:**
   - Verify JWT token configuration
   - Check token storage in localStorage

4. **Data not loading:**
   - Check service health status
   - Verify API endpoints in browser dev tools
   - Check network tab for failed requests

### Debug Mode

Enable debug logging:
```env
NEXT_PUBLIC_DEBUG=true
```

This will log all API requests and responses to the browser console.

## 📚 Next Steps

### Recommended Enhancements

1. **Add Form Components:**
   - Create/Edit medical records
   - Prescription forms
   - Billing forms

2. **Implement Real-time Updates:**
   - WebSocket connections
   - Live data synchronization

3. **Add Advanced Features:**
   - File upload for medical attachments
   - PDF generation for invoices
   - Email notifications

4. **Improve Error Handling:**
   - Retry mechanisms
   - Offline support
   - Better error messages

## 🎉 Success!

You now have a fully integrated frontend that communicates with your microservices! The system demonstrates:

- ✅ Modern React/Next.js frontend
- ✅ TypeScript for type safety
- ✅ Microservices architecture
- ✅ RESTful API integration
- ✅ Real-time health monitoring
- ✅ Production-ready code quality

Perfect for your graduation thesis demonstration! 🎓
