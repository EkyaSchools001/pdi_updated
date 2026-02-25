# Plan: n8n Configuration & Automation Control Page

This document outlines the design and implementation plan for the **"Automation" Control Center** within the Admin Dashboard. This page will allow administrators to manage, monitor, and trigger n8n workflows directly from the School Growth Hub.

---

## 1. Location & Integration
We will integrate this as a new **"Workflows"** tab within the existing **System Settings** page (`/admin/settings`). This keeps all configuration logic in one place.

- **File**: `src/pages/admin/SystemSettingsView.tsx`
- **New Tab**: `Workflows` (Icon: `Workflow` or `GitMerge`)

## 2. UI Layout & Design
The interface will feature a grid of "Workflow Cards," each representing a specific n8n automation process.

### A. Header Section
- **Global Status**: "🟢 n8n Service: Online" (Mocked check)
- **API Key Config**: A collapsible section to input the `N8N_API_KEY` and `BASE_URL`.

### B. Workflow Cards (Grid Layout)
Each workflow (User Sync, Observations, Reports, etc.) will have its own card displaying:
1.  **Header**: Icon + Workflow Name (e.g., "User Onboarding Sync").
2.  **Status Badge**: `Active` (Green) or `Inactive` (Grey).
3.  **Schedule Info**: "Runs daily at 8:00 AM".
4.  **Last Execution**: "Last run: 2 hours ago (Success)".
5.  **Control Actions**:
    -   **Toggle Switch**: Enable/Disable the workflow.
    -   **"Run Now" Button**: Manually trigger the workflow immediately.
    -   **Settings**: Edit Webhook URL or specific parameters.

## 3. Data Model
We will extend the `PlatformSettings` interface to include an `automation` object.

```typescript
interface WorkflowConfig {
    id: string; // e.g., 'user-sync'
    name: string;
    description: string;
    status: 'active' | 'inactive';
    webhookUrl: string;
    lastRun?: string;
    lastStatus?: 'success' | 'failed';
    schedule: string; // e.g., "Daily 9:00 AM"
}

interface AutomationSettings {
    n8nBaseUrl: string;
    apiKey: string;
    workflows: WorkflowConfig[];
}
```

## 4. Workflows to Configure
These align with the `N8N_WORKFLOW_STRUCTURE.md` created previously:

1.  **HR User Sync**: Syncs Darwinbox/CSV data to Users table.
2.  **Observation Feedback Loop**: Sends Slack/Email notifications on submission.
3.  **Weekly Leadership Report**: Generates PDF stats report for leaders.
4.  **Training Reminders**: Sends email 24h before events.
5.  **Document Expiry Alert**: Checks for expiring certifications daily.

## 5. Implementation Strategy (Frontend First)
Since the actual n8n instance might not be running yet, we will implement a **Simulation Layer**:

1.  **State Management**: Store `AutomationSettings` in the existing settings state.
2.  **"Run Now" Simulation**:
    -   Clicking "Run Now" will set the card to a "Running..." state.
    -   Wait 2 seconds (simulated API delay).
    -   Show a generic Success/Error toast.
    -   Update `lastRun` timestamp.
3.  **Persistence**: Save changes to the backend via the existing `/settings/upsert` endpoint.

## 6. Detailed Step-by-Step Implementation

### Step 1: Update Interfaces
Modify `SystemSettingsView.tsx` to include `AutomationSettings` and `WorkflowConfig` interfaces.

### Step 2: Define Default Data
Create a `defaultAutomationSettings` object populated with the 5 workflows described above.

### Step 3: Create the UI Components
Add the `<TabsTrigger value="workflows">` and `<TabsContent value="workflows">`.
Inside the content:
-   Render the "Global Config" section (URL/Key).
-   Map over `workflows` array to render Cards.

### Step 4: Add Interaction Logic
-   **toggleWorkflow(id)**: Updates status.
-   **triggerWorkflow(id)**: Async function causing a delay and toast notification.
-   **updateWorkflowConfig(id, key, value)**: Updates individual fields like Webhook URL.

## 7. Future Backend Connection
Once n8n is live:
1.  The "Run Now" button will make a real POST request to the `webhookUrl`.
2.  The backend will proxy these requests to avoid CORS issues if necessary.

---

**Ready to Build?**
This plan provides the blueprint. The next step is to modify `SystemSettingsView.tsx` to implement this design.
