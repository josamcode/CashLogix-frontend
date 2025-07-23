# CashLogix - Frontend

A modern, responsive expense tracking web application built with React, TailwindCSS, and integrated with a Node.js backend.

---

## 📌 Overview

CashLogix is a user-friendly expense management system that allows users to:

- Track daily expenses
- Analyze spending habits using interactive charts
- Generate reports by category and date range
- Export data as CSV
- Manage accounts (user & supervisor roles)

---

## 🔧 Technologies Used

| Technology      | Description                                 |
| --------------- | ------------------------------------------- |
| React           | JavaScript framework for UI                 |
| React Router    | Client-side routing                         |
| Axios           | HTTP client for API calls                   |
| Tailwind CSS    | Utility-first CSS framework                 |
| Recharts        | Chart library for visual analytics          |
| SweetAlert2     | Enhanced popup alerts                       |
| Context API     | State management                            |
| React-Select    | Custom select inputs with creatable options |
| SWR / useEffect | Data fetching and synchronization           |

---

## 🗂️ Folder Structure

```
/src
├── assets/            --> Images and static files
├── components/        --> Reusable UI components
│   ├── Header.jsx     --> Navigation bar with auth handling
│   ├── Footer.jsx     --> Footer section
│   └── CategorySelect.jsx --> Custom dropdown for categories
├── context/           --> Global state management
│   └── AuthContext.jsx--> Handles login/logout/token persistence
├── pages/             --> Main views
│   ├── Home.jsx       --> Landing page
│   ├── Login.jsx      --> Authentication form
│   ├── Register.jsx   --> Sign-up form
│   ├── Dashboard.jsx  --> Expense creation and overview
│   ├── Profile.jsx    --> View/edit expenses
│   ├── Reports.jsx    --> Analytics and charts
│   └── NotFound.jsx   --> 404 fallback page
├── utils/             --> Helper functions
│   └── getCookie.js   --> Cookie reader utility
├── App.jsx            --> Main app component and routing
├── index.css          --> Tailwind and global styles
└── index.js           --> Entry point of the app
```

---

## 🛠️ Setup Instructions

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Make sure your backend server is running on:

   ```
   http://localhost:5000
   ```

4. Start the development server:

   ```bash
   npm start
   ```

5. Open in browser:
   ```
   http://localhost:3000
   ```

---

## 🎨 Key Features

### 🖥️ User Interface

| Page      | Description                                                |
| --------- | ---------------------------------------------------------- |
| Home      | Introduction and marketing view                            |
| Login     | Role-based authentication                                  |
| Register  | Create new account with auto-generated supervisor password |
| Dashboard | Add and manage expenses                                    |
| Profile   | View and edit personal expenses                            |
| Reports   | Visualize spending by category/month                       |

---

### 💰 Expense Management

- Users can:

  - Add expenses with amount, category, description, and date
  - Edit or delete their own expenses
  - Filter by category and date range
  - View total monthly/yearly expenses

- Supervisors can:
  - Log in with separate password (`password2`)
  - View all data but cannot modify it

---

### 📊 Reporting Tools

- **Pie Chart**: Distribution of expenses by category
- **Line Chart**: Monthly trend of expenses
- **Bar Chart**: Total spent per category
- **CSV Export**: Export filtered data for offline use

---

## 🔐 Authentication System

- Uses cookie-based token storage
- JWT tokens are persisted after login
- Role-based access control:
  - `user`: Can add/edit/delete expenses
  - `supervisor`: Read-only access

---

## 🧩 Dependencies

```json
{
  "dependencies": {
    "axios": "^1.10.0",
    "jspdf": "^3.0.1",
    "jspdf-autotable": "^5.0.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.3",
    "react-scripts": "5.0.1",
    "react-select": "^5.10.1",
    "recharts": "^3.1.0",
    "sweetalert2": "^11.22.2"
  }
}
```

---

## 📦 Styling

- Built with **Tailwind CSS**
- Responsive layout for mobile and desktop
- Custom color theme and fonts (`Kanit`, `Rubik`)

---

## 📄 Deployment

To build for production:

```bash
npm run build
```

Then deploy the `/build` folder to your hosting provider (e.g., Vercel, Netlify, Firebase Hosting).

---

## 🧪 Future Improvements

- Add unit/integration tests
- Implement PDF report generation
- Add dark mode toggle
- Improve accessibility and localization
- Add calendar heatmap for daily insights

---
