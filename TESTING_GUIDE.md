# 🧪 Testing Guide - Hospital Management System

## 📋 Overview

This guide covers comprehensive testing strategies for the Hospital Management System, including unit tests, integration tests, end-to-end tests, and manual testing procedures.

## 🏗️ Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                          │
│                                                             │
│                    ┌─────────────┐                         │
│                    │     E2E     │ ← Cypress/Playwright    │
│                    │   Tests     │                         │
│                    └─────────────┘                         │
│                ┌─────────────────────┐                     │
│                │  Integration Tests  │ ← Jest + Supertest  │
│                └─────────────────────┘                     │
│            ┌─────────────────────────────┐                 │
│            │      Unit Tests             │ ← Jest + RTL    │
│            └─────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Testing Stack

### Frontend Testing
- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing
- **Cypress**: End-to-end testing
- **MSW**: API mocking

### Backend Testing
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library
- **Sinon**: Test spies, stubs, and mocks
- **Nock**: HTTP server mocking

## 📁 Test Structure

```
hospital-management/
├── 📁 frontend/
│   ├── 📁 __tests__/              # Test files
│   │   ├── 📁 components/         # Component tests
│   │   ├── 📁 pages/              # Page tests
│   │   ├── 📁 hooks/              # Hook tests
│   │   └── 📁 utils/              # Utility tests
│   ├── 📁 cypress/                # E2E tests
│   │   ├── 📁 e2e/                # Test specs
│   │   ├── 📁 fixtures/           # Test data
│   │   └── 📁 support/            # Support files
│   └── 📄 jest.config.js          # Jest configuration
├── 📁 backend/
│   ├── 📁 __tests__/              # Backend tests
│   │   ├── 📁 unit/               # Unit tests
│   │   ├── 📁 integration/        # Integration tests
│   │   └── 📁 e2e/                # End-to-end tests
│   └── 📄 jest.config.js          # Jest configuration
└── 📁 tests/
    ├── 📁 fixtures/               # Shared test data
    ├── 📁 helpers/                # Test utilities
    └── 📁 mocks/                  # Mock implementations
```

## 🚀 Quick Start

### Install Testing Dependencies
```bash
# Frontend testing dependencies
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom cypress

# Backend testing dependencies
cd backend
npm install --save-dev jest supertest sinon nock
```

### Run Tests
```bash
# Run all tests
npm run test

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🧪 Frontend Testing

### Component Testing with React Testing Library

#### Example: Login Component Test
```javascript
// frontend/__tests__/components/auth/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthProvider } from '@/lib/auth/AuthProvider';

const MockAuthProvider = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('LoginForm', () => {
  it('should render login form', () => {
    render(
      <MockAuthProvider>
        <LoginForm />
      </MockAuthProvider>
    );
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(
      <MockAuthProvider>
        <LoginForm />
      </MockAuthProvider>
    );
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should call login function with correct credentials', async () => {
    const mockLogin = jest.fn();
    
    render(
      <MockAuthProvider value={{ login: mockLogin }}>
        <LoginForm />
      </MockAuthProvider>
    );
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

### Hook Testing
```javascript
// frontend/__tests__/hooks/useAuth.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/lib/auth/AuthProvider';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('useAuth', () => {
  it('should return initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeTruthy();
  });
});
```

### API Mocking with MSW
```javascript
// frontend/__tests__/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'patient'
        },
        token: 'mock-jwt-token'
      })
    );
  }),

  rest.get('/api/appointments', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          patientId: '1',
          doctorId: '1',
          date: '2024-01-15',
          time: '10:00',
          status: 'scheduled'
        }
      ])
    );
  })
];
```

## 🔧 Backend Testing

### Unit Testing
```javascript
// backend/__tests__/unit/services/appointmentService.test.js
const { AppointmentService } = require('../../../src/services/appointmentService');
const { AppointmentRepository } = require('../../../src/repositories/appointmentRepository');

jest.mock('../../../src/repositories/appointmentRepository');

describe('AppointmentService', () => {
  let appointmentService;
  let mockAppointmentRepository;

  beforeEach(() => {
    mockAppointmentRepository = new AppointmentRepository();
    appointmentService = new AppointmentService(mockAppointmentRepository);
  });

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const appointmentData = {
        patientId: '1',
        doctorId: '1',
        date: '2024-01-15',
        time: '10:00'
      };

      mockAppointmentRepository.create.mockResolvedValue({
        id: '1',
        ...appointmentData,
        status: 'scheduled'
      });

      const result = await appointmentService.createAppointment(appointmentData);

      expect(result).toEqual({
        id: '1',
        ...appointmentData,
        status: 'scheduled'
      });
      expect(mockAppointmentRepository.create).toHaveBeenCalledWith(appointmentData);
    });

    it('should throw error for invalid appointment data', async () => {
      const invalidData = {
        patientId: '',
        doctorId: '1'
      };

      await expect(appointmentService.createAppointment(invalidData))
        .rejects.toThrow('Patient ID is required');
    });
  });
});
```

### Integration Testing
```javascript
// backend/__tests__/integration/appointments.test.js
const request = require('supertest');
const app = require('../../src/app');
const { setupTestDatabase, cleanupTestDatabase } = require('../helpers/database');

describe('Appointments API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/appointments', () => {
    it('should create new appointment', async () => {
      const appointmentData = {
        patientId: '1',
        doctorId: '1',
        date: '2024-01-15',
        time: '10:00'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send(appointmentData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...appointmentData,
        status: 'scheduled'
      });
    });

    it('should return 401 for unauthorized request', async () => {
      const appointmentData = {
        patientId: '1',
        doctorId: '1',
        date: '2024-01-15',
        time: '10:00'
      };

      await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(401);
    });
  });

  describe('GET /api/appointments', () => {
    it('should return user appointments', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', 'Bearer valid-jwt-token')
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            patientId: expect.any(String),
            doctorId: expect.any(String),
            date: expect.any(String),
            time: expect.any(String),
            status: expect.any(String)
          })
        ])
      );
    });
  });
});
```

## 🎭 End-to-End Testing with Cypress

### Setup Cypress
```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true
  }
});
```

### E2E Test Example
```javascript
// cypress/e2e/auth/login.cy.js
describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('should login successfully with valid credentials', () => {
    cy.get('[data-testid="email-input"]').type('patient@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('include', '/patient/dashboard');
    cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid="email-input"]').type('invalid@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
  });

  it('should redirect to appropriate dashboard based on role', () => {
    // Test patient login
    cy.login('patient@example.com', 'password123');
    cy.url().should('include', '/patient/dashboard');

    cy.logout();

    // Test doctor login
    cy.login('doctor@example.com', 'password123');
    cy.url().should('include', '/doctor/dashboard');

    cy.logout();

    // Test admin login
    cy.login('admin@example.com', 'password123');
    cy.url().should('include', '/admin/dashboard');
  });
});
```

### Custom Cypress Commands
```javascript
// cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/auth/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/auth/login');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/auth/login');
});

Cypress.Commands.add('createAppointment', (appointmentData) => {
  cy.request({
    method: 'POST',
    url: '/api/appointments',
    body: appointmentData,
    headers: {
      'Authorization': `Bearer ${Cypress.env('authToken')}`
    }
  });
});
```

## 📊 Test Coverage

### Coverage Configuration
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## 🔍 Testing Best Practices

### 1. Test Structure (AAA Pattern)
```javascript
describe('Component/Function Name', () => {
  it('should do something when condition is met', () => {
    // Arrange
    const input = 'test input';
    const expected = 'expected output';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### 2. Test Data Management
```javascript
// tests/fixtures/users.js
export const testUsers = {
  patient: {
    id: '1',
    email: 'patient@example.com',
    role: 'patient',
    profile: {
      firstName: 'John',
      lastName: 'Doe'
    }
  },
  doctor: {
    id: '2',
    email: 'doctor@example.com',
    role: 'doctor',
    profile: {
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      specialization: 'Cardiology'
    }
  }
};
```

### 3. Mock Management
```javascript
// tests/mocks/supabase.js
export const mockSupabase = {
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis()
  }))
};
```

## 🚀 Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Test Timeouts
```javascript
// Increase timeout for slow tests
jest.setTimeout(30000);

// Or per test
it('should handle slow operation', async () => {
  // test code
}, 30000);
```

#### 2. Async Testing
```javascript
// Use async/await
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

// Use waitFor for React Testing Library
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

#### 3. Mock Cleanup
```javascript
// Clean up mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
```

---

**Happy Testing! 🧪**
