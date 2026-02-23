# SuperAdmin Access Control Architecture

This document outlines the specialized real-time architecture implemented for the SuperAdmin Access Matrix. This system ensures that security changes made by a SuperAdmin are propagated across the entire platform with zero latency.

---

## 1. System Overview

The architecture follows a **Reactive Backend-to-Frontend Hub** model:
1. **SuperAdmin Console**: Modifies the global access matrix.
2. **Backend API**: Persists changes to the database and triggers a WebSocket broadcast.
3. **Permission Hub (Frontend)**: Listens for the broadcast and pushes the new configuration to all active UI components (Sidebar, Dashboard Tiles, Route Guards).

---

## 2. Backend Implementation (The Engine)

### 2.1 Storage (`Prisma & Database`)
The matrix is stored in the `SystemSettings` table under the key `access_matrix_config`.
- **Format**: JSON-encoded object containing permissions for every module (Users, Reports, Observations, etc.) mapped against five roles: `SUPERADMIN`, `ADMIN`, `LEADER`, `MANAGEMENT`, `TEACHER`.

### 2.2 Controller Logic (`settingsController.ts`)
The `upsertSetting` function performs two critical tasks:
- **Persistence**: Updates the JSON matrix in the database.
- **Broadcast**: Emits a `SETTINGS_UPDATED` event through the Socket.io instance to all connected clients.

### 2.3 Role Normalization Middleware (`auth.ts`)
The `restrictTo` middleware ensures that API access matches the matrix logic:
- Handles fuzzy role names (e.g., converts `SCHOOL_LEADER` or `School Leader` to the standard `LEADER` permission key).
- Implements a **SuperAdmin Master Bypass** for core system functions.

---

## 3. Frontend Implementation (The Reactive Layer)

### 3.1 Permission Context (`PermissionContext.tsx`)
This is the **Centralized Source of Truth** for the frontend.
- **Provider**: Wraps the entire application.
- **State Management**: Holds the current parsed Access Matrix.
- **Socket Listener**: Automatically triggers a silent background re-fetch of the matrix whenever a `SETTINGS_UPDATED` event is received.

### 3.2 Lightweight Hook (`useAccessControl.ts`)
Components no longer manage their own permission state. They call this hook, which simply queries the centralized `PermissionContext`.
```typescript
const { isModuleEnabled } = useAccessControl();
// Usage: isModuleEnabled('/admin/users', user.role)
```

### 3.3 Path-to-Module Registry
The frontend maintains a robust mapping of URL paths to Module IDs (e.g., `/leader/team` maps to the `users` module). This ensures that permissions apply logically to both the URL security and the UI elements.

---

## 4. Real-Time Sync Lifecycle

1. **TRIGGER**: SuperAdmin toggles "Observations" for Leaders to `OFF` and clicks **Submit**.
2. **BACKEND**: Receives POST request → Updates DB → `io.emit('SETTINGS_UPDATED')`.
3. **FRONTEND HUB**: Receives Socket signal → Background GET for newest matrix → Updates React State.
4. **UI UPDATE**: 
   - **Sidebar**: The "Observations" link disappears instantly.
   - **Dashboard**: The Observations stat card removes itself from the grid.
   - **Route Guard**: If the Leader was currently viewing `/leader/observations`, they are automatically redirected to `/leader`.

---

## 5. Security & Robustness

- **SuperAdmin Bypass**: SuperAdmins are never locked out of system-critical settings, regardless of matrix state.
- **Role Bridge**: Explicit mapping ensures that campus-specific roles (like "School Leader") behave exactly as the "Leader" column in the console.
- **Failure Default**: If the matrix fails to load, the system defaults to "Visible" for core modules to prevent accidental application lockouts during initial setup.
