# ACTS Frontend (React & Tailwind)

This is the web-based frontend application for the ACTS (Automated Civic Triage System), built with React, Vite, and Tailwind CSS. It features routes matching the core mobile screens.

## Getting Started

1. **Install Dependencies**
   Navigate to the `web` folder and run:
   ```bash
   npm install
   ```
   *(Note: if you encounter peer dependency errors, use `npm install --legacy-peer-deps`)*

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Environment Variables
Create or modify the `.env` file in the root of the `web/` folder:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Data Contracts (API)
Refer to `src/api/contracts.js` for the complete JSON schema and endpoint breakdown used across the components.

## Screens
The App uses React Router to render the 4 main screens matching the visual source of truth:
1. `/` (ReportForm): Citizen Issue Reporter
2. `/admin` (TicketList): Triage Inbox
3. `/map` (MapView): Live ACTS map
4. `/issue/:id` (IssueDetail): Individual issue details with YOLO overlay
