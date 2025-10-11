# ARSD-DASHBOARD

> **Transform Data Into Actionable Insights Instantly**

![last commit yesterday](https://img.shields.io/badge/last%20commit-yesterday-blue)
![typescript 96.1%](https://img.shields.io/badge/typescript-96.1%25-blue)
![languages 6](https://img.shields.io/badge/languages-6-blue)

A comprehensive construction project management dashboard built for ARSD Construction Corporation. This modern web application provides real-time project tracking, accomplishment reporting, progress monitoring, and role-based access control for construction teams.

## Built with the tools and technologies:

![JSON](https://img.shields.io/badge/-JSON-000000?style=flat-square&logo=json&logoColor=white)
![Markdown](https://img.shields.io/badge/-Markdown-000000?style=flat-square&logo=markdown&logoColor=white)
![npm](https://img.shields.io/badge/-npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![Autoprefixer](https://img.shields.io/badge/-Autoprefixer-DD3735?style=flat-square&logo=autoprefixer&logoColor=white)
![PostCSS](https://img.shields.io/badge/-PostCSS-DD3A0A?style=flat-square&logo=postcss&logoColor=white)
![TOML](https://img.shields.io/badge/-TOML-9C4221?style=flat-square&logo=toml&logoColor=white)
![Prettier](https://img.shields.io/badge/-Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black)
![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![GNU Bash](https://img.shields.io/badge/-GNU%20Bash-4EAA25?style=flat-square&logo=gnu-bash&logoColor=white)
![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Radix UI](https://img.shields.io/badge/-Radix%20UI-000000?style=flat-square&logo=radix-ui&logoColor=white)
![Stripe](https://img.shields.io/badge/-Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)
![React Hook Form](https://img.shields.io/badge/-React%20Hook%20Form-EC5990?style=flat-square&logo=react-hook-form&logoColor=white)
![Chart.js](https://img.shields.io/badge/-Chart.js-FF6384?style=flat-square&logo=chart.js&logoColor=white)

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

ARSD-DASHBOARD is a modern, full-stack web application designed specifically for construction project management. Built with Next.js 14 and TypeScript, it provides a comprehensive platform for managing construction projects, tracking progress, generating reports, and coordinating team activities.

### Key Highlights

- **🏗️ Construction-Focused**: Tailored specifically for construction project management
- **📊 Real-time Analytics**: Interactive dashboards with Chart.js and Recharts
- **👥 Role-Based Access**: Secure multi-user system with granular permissions
- **📱 Responsive Design**: Modern UI that works on all devices
- **🔐 Enterprise Security**: Row-level security with Supabase
- **📈 Progress Tracking**: Accomplishment reports and photo documentation
- **🎨 Modern UI/UX**: Built with Radix UI and Tailwind CSS

### Company Background

ARSD Construction Corporation has been delivering excellence in construction since 1998. Starting with humble beginnings in labor contracting, we've grown to become a trusted partner for:

- **Building Construction**: Residential, commercial, and industrial projects
- **Design & Plan Preparation**: Architectural design and engineering services
- **Land Development**: Site preparation, roadworks, and utilities
- **Waterproofing**: Certified waterproofing systems
- **Supply Aggregates**: Quality construction materials and logistics

**Certifications:**
- PCAB Category A License (No. 36037)
- SEC Registration (No. CS 2007 28366)
- PhilGEPS Certification (No. 2010-63063)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **Supabase CLI** (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/arsd-dashboard.git
   cd arsd-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase
   
   # Start Supabase locally
   supabase start
   
   # Apply migrations
   supabase db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Features

### 🏠 Public Website
- **Company Showcase**: Professional presentation of ARSD Construction services
- **Project Gallery**: Dynamic display of completed and ongoing projects
- **Service Overview**: Detailed information about construction services
- **Contact Integration**: Multiple ways to get in touch with the company

### 📊 Project Management Dashboard
- **Project Overview**: Comprehensive project listing and management
- **Real-time Statistics**: Live project metrics and performance indicators
- **Progress Tracking**: Visual progress indicators and status updates
- **File Management**: Secure upload and management of project documents

### 📋 Accomplishment Reports
- **Excel Parsing**: Automated parsing of accomplishment reports from Excel files
- **Data Visualization**: Charts and graphs for progress analysis
- **Report Management**: Upload, review, and approve project reports
- **Historical Tracking**: Complete audit trail of project progress

### 📸 Progress Photos
- **Photo Documentation**: Upload and organize project progress photos
- **Gallery Management**: Easy-to-use photo gallery with categorization
- **Metadata Tracking**: Automatic timestamp and location tracking
- **Storage Optimization**: Efficient cloud storage with cleanup management

### 👥 User Management
- **Role-Based Access Control**: Granular permissions for different user types
- **User Approval Workflow**: Admin-controlled user registration and approval
- **Profile Management**: Comprehensive user profile system
- **Activity Tracking**: User activity monitoring and audit logs

### 🎯 Role-Specific Features
- **Superadmin**: Full system access and user management
- **HR**: Website content and project showcase management
- **Project Manager**: Project oversight and file management
- **Project Inspector**: Assigned project inspection and reporting

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Form handling and validation
- **Chart.js & Recharts**: Data visualization

### Backend
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Relational database
- **Row-Level Security**: Database-level access control
- **Real-time Subscriptions**: Live data updates

### Development Tools
- **ESLint**: Code linting and quality
- **Prettier**: Code formatting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

### Deployment
- **Vercel**: Hosting and deployment platform
- **Supabase Cloud**: Database and authentication hosting

## Project Structure

```
arsd-dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── api/              # API routes
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── projects/        # Project-specific components
│   │   └── uploads/         # Upload-related components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   ├── services/            # Business logic services
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
├── supabase/                # Supabase configuration
│   ├── migrations/          # Database migrations
│   └── config.toml         # Supabase configuration
├── public/                  # Static assets
└── docs/                   # Documentation files
```

## Role-Based Access Control (RBAC)

The application implements a comprehensive RBAC system with five distinct user roles:

### User Roles

| Role | Permissions | Access Level |
|------|-------------|--------------|
| **Superadmin** | All permissions | Full system access, user management |
| **HR** | `manage_website_details` | Website content management only |
| **Project Manager** | `manage_uploads` | Project file management |
| **Project Inspector** | `view_assigned_projects`, `manage_uploads` | Assigned projects only |
| **Pending** | None | Awaiting approval |

### Security Features

- **Database-Level Security**: Row-Level Security (RLS) policies
- **Middleware Protection**: Route-level access control
- **Component-Level Security**: Permission-based UI rendering
- **Audit Trail**: Complete activity logging

For detailed RBAC documentation, see [RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md).

## Database Schema

The application uses a well-structured PostgreSQL database with the following key tables:

- **`profiles`**: User profiles with roles and permissions
- **`projects`**: Construction project information
- **`accomplishment_reports`**: Project progress reports
- **`progress_photos`**: Project photo documentation
- **`website_projects`**: Public project showcase data

### Key Relationships

- Users can be assigned to multiple projects
- Projects can have multiple accomplishment reports
- Progress photos are linked to specific projects
- Role-based filtering ensures data security

For detailed database documentation, see the migration files in `supabase/migrations/`.

## API Documentation

The application provides a RESTful API built with Next.js API routes:

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User authentication
- `POST /api/auth/signout` - User logout

### Project Management
- `GET /api/projects` - List projects (role-filtered)
- `POST /api/projects` - Create new project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### File Management
- `POST /api/upload` - Upload project files
- `GET /api/files/[id]` - Download files
- `DELETE /api/files/[id]` - Delete files

### Accomplishment Reports
- `POST /api/accomplishment-reports` - Upload and parse reports
- `GET /api/accomplishment-reports` - List reports
- `PUT /api/accomplishment-reports/[id]/approve` - Approve report

## Deployment

### Production Deployment

1. **Set up Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables**
   Set production environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`

3. **Deploy Database**
   ```bash
   supabase db push --linked
   ```

### Environment Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |

## Contributing

We welcome contributions to the ARSD-DASHBOARD project! Here's how you can help:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### Reporting Issues

When reporting issues, please include:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser/device information

## License

This project is proprietary software developed for ARSD Construction Corporation. All rights reserved.

---

## Contact Information

**Social Media**
- **Facebook**: [ARSD Construction Facebook Page](https://www.facebook.com/ARSDConCorp)

---

*Built with ❤️ for the construction industry*
