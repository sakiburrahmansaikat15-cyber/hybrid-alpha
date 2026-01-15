# Hybrid Alpha ERP

**Enterprise Resource Planning System** composed of Inventory, HRM, CRM, POS, and Accounting modules. Built with Laravel 10 (API) and React 18 (Frontend).

![License](https://img.shields.io/badge/license-MIT-blue)
![Laravel](https://img.shields.io/badge/backend-Laravel_10-red)
![React](https://img.shields.io/badge/frontend-React_18-cyan)

---

## 🚀 Features

### 📦 Inventory Management
- Product & Variant Management
- Stock Tracking & serial number management
- Warehouse Management
- Vendor Management
- Purchase Orders & Transactions

### 👥 Human Resource Management (HRM)
- Employee Database & Document Management
- Attendance Tracking (Shift-based)
- Leave Management (Applications & Types)
- Payroll & Salary Processing
- Department & Designation Hierarchy

### 🤝 Customer Relationship Management (CRM)
- Lead Management (Statuses, Sources)
- Customer & Company Profiles
- Opportunity Pipeline
- Activity Tracking & Campaign Management
- Support Ticketing System

### 🛒 Point of Sale (POS)
- Receipt Generation & Template Customization
- Sales & Refunds
- Customer & Group Management
- Sale Item & Tax Handling
- Multi-terminal support

### 💰 Accounting
- Chart of Accounts
- Journal Entries
- Financial Reports (Balance Sheet, Income Statement)
- Aging Reports (Payables/Receivables)

---

## 🛠️ Tech Stack

**Backend:**
- **Framework:** Laravel 10
- **Database:** MySQL 8.0
- **Authentication:** Laravel Sanctum (Token-based)
- **API:** RESTful architecture

**Frontend:**
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS 4 + Material UI 7
- **State Management:** Redux Toolkit
- **Routing:** React Router v7
- **Animations:** Framer Motion

---

## 📥 Installation

### Prerequisites
- PHP >= 8.1
- Composer
- Node.js >= 18
- MySQL

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/hybrid-alpha.git
cd hybrid-alpha
```

### 2. Backend Setup
```bash
# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Configure database in .env
DB_DATABASE=hybrid_alpha
DB_USERNAME=root
DB_PASSWORD=

# Generate Application Key
php artisan key:generate

# Run Migrations & Seeders
php artisan migrate:fresh --seed
```

### 3. Frontend Setup
```bash
# Install Node dependencies
npm install

# Start Development Server
npm run dev
```

### 4. Running the Application
- **Backend:** `php artisan serve` (http://127.0.0.1:8000)
- **Frontend:** `npm run dev` (http://localhost:5173)

---

## 🔑 Default Credentials

**Admin User:**
- **Email:** `admin@example.com`
- **Password:** `password`

---

## 📚 API Documentation

The API follows RESTful standards. All responses are JSON.

**Base URL:** `http://127.0.0.1:8000/api`

### Authentication headers
All protected routes require the following header:
`Authorization: Bearer <your_token>`

### Core Endpoints
- `POST /login` - Authenticate user
- `GET /me` - Get current user profile
- `GET /products` - List products
- `GET /stocks` - List inventory

*(Detailed API documentation can be generated using Scribe or viewed in the Postman collection)*

---

## 🧪 Testing

Run lower-level tests with PHPUnit:
```bash
php artisan test
```

---

## 🔒 Security

- **Input Validation:** Form Requests are used for strict validation.
- **Authentication:** Sanctum tokens are secure and revocable.
- **Authorization:** Policy gates ensure role-based access.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**© 2026 Mystrix IT. All Rights Reserved.**
