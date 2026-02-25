# n8n Workflow & Project Architecture Diagrams

This document visualizes the automation workflows and internal project logic using **Mermaid** diagrams. You can view these diagrams in any Markdown viewer that supports Mermaid (like GitHub, GitLab, VS Code, or Notion).

---

## Part 1: n8n Automation Workflows
*These diagrams represent the node-based flow you should build in n8n. Each box represents a Node.*

### 1. User Onboarding & Sync
**Goal**: Sync employees from HR System (e.g., Darwinbox) to School Growth Hub automatically.

```mermaid
graph LR
    %% Styles
    classDef trigger fill:#ff6d5a,stroke:#333,stroke-width:2px,color:white;
    classDef action fill:#40a9ff,stroke:#333,stroke-width:2px,color:white;
    classDef logic fill:#ffc107,stroke:#333,stroke-width:2px,color:black;

    Start((Trigger: Daily/Webhook)):::trigger --> FetchHR[HTTP: Fetch HR Data]:::action
    FetchHR --> Split[Split In Batches]:::logic
    Split --> Check{User Exists?}:::logic
    Check -- No --> Create[HTTP POST: Create User]:::action
    Check -- Yes --> Update[HTTP PATCH: Update User]:::action
    Create --> Email[Email: Send Login Details]:::action
    Update --> Next[Next Item]:::logic
    Email --> Next
```

### 2. Observation Feedback Loop
**Goal**: Notify teachers immediately upon submission of an observation.

```mermaid
graph LR
    classDef trigger fill:#ff6d5a,stroke:#333,stroke-width:2px,color:white;
    classDef action fill:#40a9ff,stroke:#333,stroke-width:2px,color:white;
    classDef slack fill:#4A154B,stroke:#333,stroke-width:2px,color:white;

    Webhook((Webhook: Observation Submitted)):::trigger --> Lookup[Postgres: Get Teacher Details]:::action
    Lookup --> Format[Function: Create Message]:::action
    Format --> Notify{Channel?}:::logic
    Notify -- Slack --> SlackNode[Slack: Send Message]:::slack
    Notify -- Email --> EmailNode[Email: Send Summary]:::action
```

### 3. Weekly Leadership Reports
**Goal**: Email statistics summary to leaders every Monday morning.

```mermaid
graph LR
    classDef trigger fill:#ff6d5a,stroke:#333,stroke-width:2px,color:white;
    classDef action fill:#40a9ff,stroke:#333,stroke-width:2px,color:white;

    Cron((Cron: Monday 8AM)):::trigger --> FetchStats[HTTP GET: /stats/weekly]:::action
    FetchStats --> GenPDF[HTML to PDF: Create Report]:::action
    GenPDF --> GetLeaders[Postgres: Get All Leaders]:::action
    GetLeaders --> Split[Split Batches]:::logic
    Split --> SendEmail[Email: Send PDF Attachment]:::action
    SendEmail --> Split
```

### 4. Training Session Reminders
**Goal**: Remind attendees 24 hours before a training event.

```mermaid
graph LR
    classDef trigger fill:#ff6d5a,stroke:#333,stroke-width:2px,color:white;
    classDef action fill:#40a9ff,stroke:#333,stroke-width:2px,color:white;

    Cron((Cron: Daily 9AM)):::trigger --> GetEvents[HTTP GET: Tomorrow's Events]:::action
    GetEvents --> LoopEvents[Split: For Each Event]:::logic
    LoopEvents --> GetAttendees[Postgres: Get Participants]:::action
    GetAttendees --> LoopUsers[Split: For Each User]:::logic
    LoopUsers --> SendRem[Email: Send Reminder]:::action
    SendRem --> LoopUsers
```

### 5. Document Expiry Alerts
**Goal**: Alert users when their uploaded certifications are about to expire.

```mermaid
graph LR
    classDef trigger fill:#ff6d5a,stroke:#333,stroke-width:2px,color:white;
    classDef action fill:#40a9ff,stroke:#333,stroke-width:2px,color:white;

    Trigger((Cron: Daily)):::trigger --> DBQuery[Postgres: Query Expiring Docs]:::action
    DBQuery --> Split[Split In Batches]:::logic
    Split --> SendAlert[Email: Send Renewal Alert]:::action
    SendAlert --> Split
```

---

## Part 2: Project Module Flows (Sequence Diagrams)
*These diagrams show the interaction between Users, the Frontend, and the Backend logic.*

### 1. Observation Process Flow
**Actors**: Leader (Observer), Teacher (Observee)

```mermaid
sequenceDiagram
    participant Leader
    participant Frontend
    participant Backend
    participant DB
    participant n8n

    Leader->>Frontend: Selects Teacher & Template
    Frontend->>Backend: GET /templates
    Backend-->>Frontend: Returns Form Template
    Leader->>Frontend: Fills Scores & Notes
    Leader->>Frontend: Clicks "Submit"
    Frontend->>Backend: POST /observations
    Backend->>DB: Save Observation
    Backend->>n8n: Trigger Webhook (Async)
    n8n->>Teacher: Send Notification (Email/Slack)
    Backend-->>Frontend: Success Response
    Frontend-->>Leader: Show Success Message
    Note over Teacher: Teacher logs in later
    Teacher->>Frontend: Views Observation
    Teacher->>Backend: POST /observations/:id/reflection
```

### 2. Professional Development (PD) Goals Flow
**Actors**: Teacher, Leader

```mermaid
sequenceDiagram
    participant Teacher
    participant Backend
    participant Leader

    Teacher->>Backend: POST /goals (Create Goal)
    Note right of Backend: Goal Status: "Pending Approval"
    Leader->>Backend: GET /goals (View Team Goals)
    Leader->>Backend: PATCH /goals/:id/approve
    Note right of Backend: Goal Status: "In Progress"
    Teacher->>Backend: PATCH /goals/:id/progress (Update %)
    Teacher->>Backend: PATCH /goals/:id/complete
    Note right of Backend: Goal Status: "Completed"
```

### 3. Training Event Registration Flow
**Actors**: Admin, Teacher

```mermaid
sequenceDiagram
    participant Admin
    participant Backend
    participant Teacher

    Admin->>Backend: POST /trainings (Create Event)
    Teacher->>Backend: GET /trainings (View Calendar)
    Teacher->>Backend: POST /trainings/:id/register
    Note right of Backend: Check Capacity & Conflicts
    Backend-->>Teacher: Registration Confirmed
    Note over Backend: Day of Event
    Admin->>Backend: POST /attendance (Mark Present)
    Backend->>Backend: Add PD Hours to Teacher Profile
```

### 4. Document Management & Acknowledgement
**Actors**: Admin, Teacher

```mermaid
sequenceDiagram
    participant Admin
    participant S3_Storage
    participant Backend
    participant Teacher

    Admin->>Backend: Upload Policy Document
    Backend->>S3_Storage: Store File
    Backend->>Backend: Create Document Record (Req. Ack = True)
    Teacher->>Backend: GET /documents
    Backend-->>Teacher: List (Shows "Pending Action")
    Teacher->>Backend: GET /documents/:id/download
    Teacher->>Backend: POST /documents/:id/acknowledge
    Backend->>Backend: Record Timestamp & UserID
```
