# Hospital Management - MCP Implementation Plan
## Dựa trên phân tích codebase thực tế

---

## 🎯 **PHASE 1: CRITICAL GAPS (Week 1)**

### **1.1 File System MCP → Replace File Storage Service**
```bash
# Install
npm install -g @modelcontextprotocol/server-filesystem

# Integration point
# backend/services/file-storage-service/ (currently commented out)
```

**Implementation:**
```javascript
// backend/services/file-storage-service/src/mcp-file-service.js
const { MCPClient } = require('@modelcontextprotocol/client');

class FileStorageMCPService {
  async uploadMedicalDocument(patientId, file, documentType) {
    const mcpClient = new MCPClient('filesystem');
    const patientDir = `./medical-files/patients/${patientId}`;
    
    // Create directory structure
    await mcpClient.createDirectory(patientDir);
    
    // Save file
    const fileName = `${documentType}-${Date.now()}-${file.originalname}`;
    const filePath = `${patientDir}/${fileName}`;
    await mcpClient.writeFile(filePath, file.buffer);
    
    // Save metadata to Supabase (existing connection)
    return await this.saveFileMetadata({
      patient_id: patientId,
      file_path: filePath,
      file_name: fileName,
      document_type: documentType
    });
  }
}
```

### **1.2 Email MCP → Enhance Notification Service**
```bash
# Install
npm install -g @modelcontextprotocol/server-email

# Integration point
# backend/services/notification-service/src/index.ts (currently placeholder)
```

**Implementation:**
```javascript
// backend/services/notification-service/src/email-mcp-service.js
const { MCPClient } = require('@modelcontextprotocol/client');

class EmailMCPService {
  async sendAppointmentConfirmation(appointmentData) {
    const mcpClient = new MCPClient('email');
    
    const emailData = {
      to: appointmentData.patient.email,
      subject: `Xác nhận lịch hẹn - ${appointmentData.doctor.name}`,
      html: `
        <h2>Xác nhận lịch hẹn</h2>
        <p>Bác sĩ: ${appointmentData.doctor.name}</p>
        <p>Thời gian: ${appointmentData.appointment_time}</p>
        <p>Phòng: ${appointmentData.room}</p>
      `
    };
    
    return await mcpClient.sendEmail(emailData);
  }
}
```

### **1.3 PDF MCP → Medical Records Service**
```bash
# Install  
npm install -g @modelcontextprotocol/server-pdf

# Integration point
# backend/services/medical-records-service/src/app.ts
```

**Implementation:**
```javascript
// backend/services/medical-records-service/src/pdf-generator.js
const { MCPClient } = require('@modelcontextprotocol/client');

class MedicalReportGenerator {
  async generatePatientReport(patientId, recordId) {
    const mcpClient = new MCPClient('pdf');
    
    // Get data from Supabase (existing connection)
    const reportData = await this.getPatientMedicalData(patientId, recordId);
    
    const pdfOptions = {
      template: './templates/medical-report.html',
      data: reportData,
      filename: `medical-report-${patientId}-${recordId}.pdf`,
      options: { format: 'A4', margin: '20mm' }
    };
    
    return await mcpClient.generatePDF(pdfOptions);
  }
}
```

---

## 🤖 **PHASE 2: AI ACTIVATION (Week 2)**

### **2.1 OpenAI MCP → Create AI Service**
```bash
# Install
npm install -g @modelcontextprotocol/server-openai

# Create new service
# backend/services/ai-service/ (Port 3012)
```

**Kết nối với 14 AI tables có sẵn:**
```javascript
// backend/services/ai-service/src/chatbot-service.js
const { MCPClient } = require('@modelcontextprotocol/client');

class AIChatbotService {
  async processPatientQuery(userId, message) {
    const mcpClient = new MCPClient('openai');
    
    // Get conversation history from existing chatbot_conversations table
    const conversation = await this.getConversationHistory(userId);
    
    // Use existing diseases and symptoms tables for context
    const medicalContext = await this.getMedicalKnowledgeBase();
    
    const aiResponse = await mcpClient.chat({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: `Medical assistant with knowledge: ${medicalContext}` },
        ...conversation,
        { role: 'user', content: message }
      ]
    });
    
    // Save to existing chatbot_conversations table
    await this.saveConversation(userId, message, aiResponse.content);
    
    return aiResponse;
  }
}
```

---

## ⚡ **PHASE 3: ENHANCEMENTS (Week 3)**

### **3.1 SMS MCP → Notification Service**
```bash
# Install
npm install -g @modelcontextprotocol/server-sms

# Integration point  
# backend/services/notification-service/src/index.ts
```

### **3.2 Calendar MCP → Appointment Service**
```bash
# Install
npm install -g @modelcontextprotocol/server-calendar

# Integration point
# backend/services/appointment-service/src/index.ts
```

### **3.3 Excel MCP → Reporting**
```bash
# Install
npm install -g @modelcontextprotocol/server-excel

# Integration point
# backend/api-gateway/ hoặc tạo reporting service mới
```

---

## 🔧 **INTEGRATION WITH EXISTING ARCHITECTURE**

### **API Gateway Routes (Port 3100)**
```javascript
// backend/api-gateway/src/mcp-routes.js
app.use('/api/files', fileStorageService);     // File System MCP
app.use('/api/notifications', notificationService); // Email/SMS MCP  
app.use('/api/reports', medicalRecordsService);     // PDF MCP
app.use('/api/ai', aiService);                      // OpenAI MCP
```

### **Docker Compose Updates**
```yaml
# backend/docker-compose.yml
services:
  # Uncomment and update file-storage-service
  file-storage-service:
    build: ./services/file-storage-service
    ports:
      - "3010:3010"
    volumes:
      - ./medical-files:/app/medical-files
  
  # Add new ai-service
  ai-service:
    build: ./services/ai-service  
    ports:
      - "3012:3012"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

---

## 📊 **EXPECTED OUTCOMES**

### **After Phase 1:**
- ✅ File upload/download working
- ✅ Email notifications functional  
- ✅ PDF reports generated
- ✅ Core hospital operations complete

### **After Phase 2:**
- ✅ AI chatbot active (using 14 existing tables)
- ✅ Medical knowledge queries working
- ✅ Symptom analysis functional

### **After Phase 3:**
- ✅ SMS notifications working
- ✅ Advanced appointment scheduling
- ✅ Management reporting system

---

## 🚀 **QUICK START COMMANDS**

```powershell
# Phase 1 - Critical
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-email  
npm install -g @modelcontextprotocol/server-pdf

# Phase 2 - AI
npm install -g @modelcontextprotocol/server-openai

# Phase 3 - Enhancements
npm install -g @modelcontextprotocol/server-sms
npm install -g @modelcontextprotocol/server-calendar
npm install -g @modelcontextprotocol/server-excel

# Create directories
mkdir medical-files, pdf-templates, ai-templates

# Test installations
npx @modelcontextprotocol/server-filesystem ./medical-files
npx @modelcontextprotocol/server-email
npx @modelcontextprotocol/server-pdf
```

Với plan này, bạn sẽ hoàn thiện được những gaps quan trọng trong dự án và đưa hệ thống lên 100% functional! 🏥✨
