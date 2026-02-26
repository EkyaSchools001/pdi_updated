# Frontend-Backend Connection Guide: School Growth Hub

This document outlines the strategy and implementation steps for connecting the React frontend to the Express/TypeScript backend.

## 1. Backend Preparation (CORS)
The backend is already configured with the `cors` middleware, allowing the frontend (typically running on `localhost:8080` or `5173`) to communicate with the API on `localhost:4000`.

**File**: `backend/src/app.ts`
```typescript
app.use(cors()); // Currently allows all origins; restrict this in production
```

## 2. Frontend Configuration

### A. Environment Variables
Create a `.env` file in the project root (frontend) to store the API URL:
```env
VITE_API_URL=http://localhost:4000/api/v1
```

### B. API Service Utility (Axios)
Create a centralized service to handle API calls and inject the Auth token.

**Suggested File**: `src/lib/api.ts`
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor to add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## 3. Implementation Examples

### A. Authentication (Login)
Replace the current mock login logic in `src/pages/Auth.tsx`.

```typescript
import api from '@/lib/api';

const handleLogin = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { token, data } = response.data;
    
    // Persist token and user info
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    
    // Redirect based on role
    navigate(data.user.role === 'ADMIN' ? '/admin' : '/teacher');
  } catch (error) {
    toast.error("Login failed. Check your credentials.");
  }
};
```

### B. Fetching Observations
Replace the static `observations` array in `src/pages/TeacherDashboard.tsx` or `LeaderDashboard.tsx`.

```typescript
import api from '@/lib/api';

const fetchObservations = async () => {
  try {
    const response = await api.get('/observations');
    setObservations(response.data.data.observations);
  } catch (error) {
    console.error("Error loading observations", error);
  }
};

useEffect(() => {
  fetchObservations();
}, []);
```

### C. Submitting an Observation
Update the `onSubmit` handler in the `ObserveView`.

```typescript
const onSubmit = async (formData) => {
  try {
    await api.post('/observations', formData);
    toast.success("Observation submitted successfully!");
    navigate('/leader');
  } catch (error) {
    toast.error("Failed to submit observation.");
  }
};
```

## 4. Connection Workflow Summary
1.  **Start Backend**: `cd backend && npm run dev` (running on port 4000).
2.  **Start Frontend**: `npm run dev` (running on port 8080).
3.  **Token Flow**: On login, backend issues JWT -> Frontend stores JWT -> Frontend sends JWT in `Authorization` header for all subsequent calls -> Backend verifies JWT and identifies the user/role.
4.  **Data Flow**: Frontend requests JSON -> Backend queries DB (Prisma) -> Backend returns JSON -> Frontend updates React state.
