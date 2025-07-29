# Repository Management System

## Overview

This is a full-stack web application for managing digital assets (images, videos, PDFs, etc.) with Google Drive integration. The system provides centralized repository management with automated organization, metadata tracking, and comprehensive search capabilities. Built with a modern TypeScript stack using React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON responses
- **File Upload**: Multer middleware for handling multipart/form-data
- **External Integration**: Google Drive API for cloud storage

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **File Storage**: Google Drive API for actual file storage
- **Session Storage**: connect-pg-simple for PostgreSQL-backed sessions

## Key Components

### Database Schema
- **Users Table**: Basic user authentication (id, username, password)
- **Assets Table**: Comprehensive asset metadata including:
  - File information (filename, size, MIME type)
  - Categorization (category, asset type, region, state, resort)
  - Temporal data (year, month, upload date)
  - Google Drive integration (file ID, folder ID, links)
  - User features (favorites, tags, version control)

### API Endpoints
- **Asset Management**: CRUD operations for assets with filtering and search
- **File Upload**: Multipart upload with Google Drive integration
- **Metadata Operations**: Favorite toggling, tag management
- **Statistics**: Dashboard metrics and analytics

### Frontend Components
- **Dashboard**: Main interface with asset grid/list views
- **Upload Modal**: Drag-and-drop file upload with metadata forms
- **Asset Preview**: Modal for viewing asset details and actions
- **Sidebar**: Navigation and filtering controls
- **Header**: Search functionality and user interface

## Data Flow

1. **Asset Upload Process**:
   - User uploads files through drag-and-drop interface
   - Files are temporarily stored locally via Multer
   - Files are uploaded to Google Drive using service account
   - Metadata is extracted and stored in PostgreSQL
   - Hierarchical folder structure is maintained on Google Drive

2. **Asset Retrieval**:
   - Frontend queries backend API with filters/search terms
   - Backend queries PostgreSQL with appropriate filters
   - Results include Google Drive links for file access
   - Pagination and sorting applied for performance

3. **Google Drive Integration**:
   - Service account authentication for secure access
   - Automated folder structure creation
   - Direct links to files and version folders
   - Thumbnail generation for supported file types

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **googleapis**: Google Drive API integration
- **drizzle-orm**: Type-safe ORM for PostgreSQL
- **@tanstack/react-query**: Server state management
- **multer**: File upload handling
- **exceljs**: Excel file generation for asset tracking

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-dropzone**: File drag-and-drop functionality

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Neon serverless PostgreSQL
- **File Storage**: Google Drive API with service account

### Production Build
- **Frontend**: Static assets built with Vite
- **Backend**: Bundled with esbuild for optimal performance
- **Database**: Production Neon database
- **Environment**: Single Node.js process serving both API and static files

### Configuration Requirements
- **DATABASE_URL**: PostgreSQL connection string
- **GOOGLE_CREDENTIALS_PATH**: Service account key file path
- **Environment Variables**: Managed through .env files

### Folder Structure Strategy
The system implements a hierarchical Google Drive folder structure:
```
/Assets/
  ├── Brand/
  │   └── [State]/[Region]/[Resort]/[Year]/[Month]/[AssetType]/
  └── Tactical/
      └── [State]/[Region]/[Resort]/[Year]/[Month]/[AssetType]/
```

This structure supports the requirement for systematic organization and easy retrieval of assets based on multiple criteria including geographical location, time period, and asset type.