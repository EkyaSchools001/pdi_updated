# School Growth Hub Backend Setup

## 🚀 Quick Start (Docker)
The easiest way to get the environment running is with Docker:

```bash
docker-compose up --build
```

This will spin up:
- The Backend API on `http://localhost:4000`
- A PostgreSQL 15 database on `http://localhost:5432`

## 🛠 Manual Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment**:
   Copy `.env.example` to `.env` and update the `DATABASE_URL`.

3. **Prisma Setup**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Run Seed Data**:
   ```bash
   npx ts-node src/seed.ts
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 📖 API Documentation
Once the server is running, visit:
`http://localhost:4000/api-docs` to see the interactive Swagger UI.

## 📁 Key Directories
- `src/api/controllers`: Logic for each endpoint.
- `src/api/routes`: API entry points.
- `src/api/middlewares`: Auth, RBAC, and Error handling.
- `prisma/schema.prisma`: Database source of truth.
