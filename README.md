# DocuFlow CRM Module

An independent CRM module for DocuFlow-AI, managing Leads, Deals, Customers, Departments, User Management, Roles & Permissions, and Custom Fields.

## Project Structure

```
docuflow-crm/
├── backend/          # Express.js backend API
├── frontend/         # React frontend application
├── shared/           # Shared utilities and types
└── database/         # Database migrations and scripts
```

## Features

- **Leads Management** - Track and manage sales leads
- **Deals Management** - Manage opportunities with follow-ups, notes, and documents
- **Customer Management** - Comprehensive customer/client information
- **Custom Fields** - Dynamic form fields across all modules
- **User Management** - Shared authentication and authorization
- **Roles & Permissions** - Granular access control
- **Department Management** - Organizational structure

## Technology Stack

- **Backend:** Node.js, Express, TypeScript, Supabase
- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** JWT / Supabase Auth

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials

4. Run database migrations:
   ```bash
   cd backend
   npm run migrate
   ```

5. Start development servers:
   ```bash
   # Backend (runs on port 3001)
   cd backend
   npm run dev
   
   # Frontend (runs on port 5174)
   cd frontend
   npm run dev
   ```

## Architecture

This CRM module uses a **shared database architecture** where:
- CRM module has its own backend and frontend
- Shares the same Supabase database with the main DocuFlow application
- Shared user authentication and authorization
- Independent deployment capability

See [implementation_plan.md](../implementation_plan.md) for detailed architecture documentation.

## API Documentation

API endpoints are prefixed with `/api/crm/`:

- `/api/crm/leads` - Leads management
- `/api/crm/deals` - Deals management
- `/api/crm/customers` - Customer management
- `/api/crm/custom-fields` - Custom fields management
- `/api/crm/settings` - CRM settings

## Development

```bash
# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

## License

Proprietary - All rights reserved
