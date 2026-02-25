# School Growth Hub - Backend Architecture Plan

## 1. Executive Summary
The School Growth Hub is a comprehensive platform for managing educator observations, professional development goals, and training. This document outlines the backend architecture designed to provide a secure, scalable, and real-time environment for school leaders and teachers.

## 2. Technology Stack
- **Runtime**: Node.js (Version 18+ LTS)
- **Framework**: Express.js with TypeScript (or NestJS for advanced modularity)
- **Database**: PostgreSQL (Structured relational data)
- **ORM**: Prisma (Type-safe database client and migrations)
- **Authentication**: Supabase Auth / JWT with Role-Based Access Control (RBAC)
- **Documentation**: Swagger/OpenAPI
- **Validation**: Zod (Schema validation)
- **Realtime**: Socket.io or Supabase Realtime (for live notifications)

## 3. Core Data Entities (ERD)

### Users & Roles
- **Users**: `id`, `email`, `full_name`, `avatar_url`, `role` (Admin, Leader, Teacher), `campus_id`, `department`
- **Roles/Permissions**: Granular access control mapping roles to specific features (e.g., `can_observe`, `can_manage_goals`).

### Observations
- **Observations**: `id`, `teacher_id`, `observer_id`, `date`, `domain`, `score`, `notes`, `status` (Draft/Submitted)
- **ObservationDomains**: `id`, `observation_id`, `domain_id`, `rating`, `evidence`
- **Feedback**: `id`, `observation_id`, `action_step`, `teacher_reflection`, `discussion_met`

### Growth & Development
- **Goals**: `id`, `teacher_id`, `title`, `description`, `progress`, `due_date`, `status`, `is_school_aligned`
- **TrainingEvents**: `id`, `title`, `topic`, `type`, `date`, `location`, `capacity`, `status`
- **Registrations**: `id`, `event_id`, `user_id`, `registration_date`
- **PDHours**: `id`, `user_id`, `activity`, `hours`, `category`, `status`

## 4. API Structure (RESTful)

### `/api/v1/auth`
- `POST /login`: Authenticate and receive JWT
- `POST /refresh`: Refresh session tokens

### `/api/v1/observations`
- `GET /`: List observations (filtered by role/permissions)
- `POST /`: Submit new observation
- `GET /:id`: Detailed view of an observation
- `PATCH /:id`: Update draft/notes

### `/api/v1/goals`
- `GET /`: List teacher goals
- `POST /`: Create goal
- `PATCH /:id/progress`: Update goal progress

### `/api/v1/trainings`
- `GET /`: List upcoming training sessions
- `POST /register`: Enroll in a session

## 5. Security & Access Control
- **Authentication**: JWT-based session management.
- **RBAC**: Middleware to protect routes based on user role.
- **Data Privacy**: Teachers only see their own observations; Leaders see their team; Admins see institutional data.
- **Validation**: Sanitization of all inputs via Zod to prevent injection and ensuring data integrity.

## 6. Infrastructure & Deployment
- **Containerization**: Docker for local development and production consistency.
- **CI/CD**: GitHub Actions for automated testing and deployment.
- **Hosting**: AWS (EC2/RDS) or Supabase (Database + Edge Functions).
- **Environment Management**: `.env` for secrets (DB URLs, API Keys).

## 7. Folder Structure Proposal
```text
/backend
  /src
    /api
      /controllers   # Request handling
      /routes        # Endpoint definitions
      /middlewares   # Auth, Validation, Logging
    /core
      /services      # Business logic
      /models        # Prisma schemas / Types
    /infrastructure
      /database      # DB connection, Migrations
      /utils         # Helpers (Logger, JWT)
    app.ts           # Entry point
  package.json
  tsconfig.json
  prisma/
    schema.prisma    # DB Schema
```
