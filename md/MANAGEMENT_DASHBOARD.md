# Management Dashboard Setup

## Overview
The Management Dashboard has been successfully added to the School Growth Hub application. This dashboard provides executive-level insights into PDI (Professional Development & Improvement) health, campus performance, and teacher development metrics.

## Login Credentials

**Email:** management@pms.com  
**Password:** password123

## Features

The Management Dashboard includes the following sections:

### 1. **Overview**
- Executive overview with organization-level KPIs
- PDI progress trends across the academic year
- Goal status distribution
- Key insights and alerts

### 2. **PDI Health Index**
- Total goals created and completion rates
- Goal quality scores
- Goal health across different pillars
- Pillar-wise goal distribution

### 3. **Campus Performance**
- Campus benchmarking and comparison
- Staff distribution across campuses
- Goal completion vs. growth metrics
- Campus registry with performance indicators

### 4. **Teaching & Learning Pillars**
- Goals by focus pillar
- Pillar improvement trends
- Strongest and weakest areas
- Most selected focus areas

### 5. **PD Impact Analysis**
- Correlation between PD hours and goal growth
- PD effectiveness by pillar
- High-impact PD sessions
- Teacher growth statistics

### 6. **Leadership Effectiveness**
- Leader benchmarking
- Coaching engagement metrics
- Follow-up index vs. goal progress
- Team growth scores

### 7. **Risk & Intervention Watch**
- Critical campus alerts
- Stagnant goals tracking
- Risk severity by campus
- Recommended interventions

### 8. **Reports & Exports**
- Board-ready PDF reports
- Raw data exports (Excel/CSV)
- Academic year summary

## How to Access

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on: http://localhost:4000

2. **Start the Frontend Server:**
   ```bash
   npm run dev
   ```
   Frontend will run on: http://localhost:8080

3. **Login:**
   - Navigate to http://localhost:8080/login
   - Enter the management credentials
   - You will be automatically redirected to the management dashboard

## Navigation

The management dashboard has a dedicated sidebar with the following menu items:
- Overview
- PDI Health
- Campus Performance
- Pillars
- PD Impact
- Leadership
- Risk & Intervention
- Reports

## Technical Details

### Files Added/Modified:
1. **New Files:**
   - `src/pages/ManagementDashboard.tsx` - Main dashboard component

2. **Modified Files:**
   - `src/components/RoleBadge.tsx` - Added management role
   - `src/components/layout/DashboardSidebar.tsx` - Added management navigation
   - `src/App.tsx` - Added management route
   - `src/hooks/useAuth.tsx` - Added management redirect
   - `src/pages/Auth.tsx` - Added management credentials
   - `backend/src/seed.ts` - Added management user
   - `backend/package.json` - Added seed script
   - `backend/prisma/schema.prisma` - Fixed database URL

### Role-Based Access:
- The management dashboard is accessible to users with the `MANAGEMENT` or `SUPERADMIN` role
- Protected route ensures only authorized users can access the dashboard

## Data Seeding

To add the management user to the database, you can manually run:
```bash
cd backend
npx ts-node src/seed.ts
```

Or use the Prisma seed command:
```bash
cd backend
npx prisma db seed
```

## Notes

- All data in the dashboard is currently mock data for demonstration purposes
- The dashboard uses Recharts for data visualization
- The UI follows the same design system as the rest of the application
- The dashboard is fully responsive and works on mobile devices
