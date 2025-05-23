# API Documentation

## Overview

This document describes the API endpoints for the Hospital Management System.

## Base URLs

- **API Gateway**: `http://localhost:3000`
- **Auth Service**: `http://localhost:3001`
- **Doctor Service**: `http://localhost:3002`
- **Patient Service**: `http://localhost:3003`
- **Appointment Service**: `http://localhost:3004`

## Authentication

All API requests require authentication using JWT tokens.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## API Endpoints

### Authentication Service

#### POST /auth/login
Login user and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

#### POST /auth/register
Register new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "admin"
}
```

### Doctor Service

#### GET /doctors
Get all doctors.

#### GET /doctors/:id
Get doctor by ID.

#### POST /doctors
Create new doctor.

#### PUT /doctors/:id
Update doctor.

#### DELETE /doctors/:id
Delete doctor.

### Patient Service

#### GET /patients
Get all patients.

#### GET /patients/:id
Get patient by ID.

#### POST /patients
Create new patient.

#### PUT /patients/:id
Update patient.

#### DELETE /patients/:id
Delete patient.

### Appointment Service

#### GET /appointments
Get all appointments.

#### GET /appointments/:id
Get appointment by ID.

#### POST /appointments
Create new appointment.

#### PUT /appointments/:id
Update appointment.

#### DELETE /appointments/:id
Delete appointment.

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
