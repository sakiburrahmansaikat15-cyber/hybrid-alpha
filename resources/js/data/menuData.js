// data/menuData.js
export const menuData = {
  menuItems: [
    // --- DASHBOARD (Group 1) ---
    {
      id: 1,
      title: "Dashboard",
      icon: "LayoutDashboard",
      path: "/",
      badge: "New",
      submenu: [
        { id: 11, title: "Overview", path: "/", icon: "LayoutDashboard" },
        { id: 12, title: "AI Analytics", path: "/analytics", icon: "BrainCircuit", badge: "Beta" }
      ]
    },

    // --- INVENTORY MANAGEMENT (Group 2) ---
    {
      id: 2,
      title: "Inventory",
      icon: "Package",
      path: "/inventory",
      submenu: [
        { id: 21, title: "Products", path: "/Products", icon: "Box" },
        { id: 22, title: "Categories", path: "/categories", icon: "Layers" },
        { id: 23, title: "Brands", path: "/Brands", icon: "Tag" },
        { id: 24, title: "Warehouses", path: "/Warehouses", icon: "Warehouse" },
        { id: 25, title: "Stock Management", path: "/Stocks", icon: "ClipboardList" },
        { id: 26, title: "Serial Numbers", path: "/serial-list", icon: "Barcode" },
        { id: 27, title: "Suppliers", path: "/Vendor", icon: "Truck" },
        { id: 28, title: "Procurement", path: "/procurement", icon: "ShoppingCart" }
      ]
    },

    // --- SALES & POS (Group 3) ---
    {
      id: 3,
      title: "Sales & POS",
      icon: "ShoppingCart",
      path: "/pos",
      submenu: [
        { id: 301, title: "POS Terminal", path: "/checkout", icon: "Monitor", badge: "Live" },
        { id: 302, title: "POS Terminal List", path: "/pos-terminals", icon: "List" },
        { id: 303, title: "Sales History", path: "/sales", icon: "History" },
        { id: 304, title: "Payment Methods", path: "/Payment-Methods", icon: "CreditCard" },
        { id: 305, title: "Held Carts", path: "/hold-carts", icon: "PauseCircle" },
        { id: 306, title: "Sale Returns", path: "/sale-returns", icon: "RotateCcw" },
        { id: 307, title: "Gift Cards", path: "/gift-cards", icon: "Gift" }
      ]
    },

    // --- CRM SOLUTION (Group 4) ---
    {
      id: 4,
      title: "CRM Solution",
      icon: "Users",
      path: "/crm",
      submenu: [
        { id: 401, title: "Dashboard", path: "/crm/dashboard", icon: "LayoutDashboard" },
        { id: 402, title: "Customers", path: "/customer", icon: "UserCheck" },
        { id: 403, title: "Leads", path: "/lead", icon: "UserPlus" },
        { id: 404, title: "Deals", path: "/opportunity", icon: "Target" },
        { id: 405, title: "Activities", path: "/activity", icon: "Calendar" },
        { id: 406, title: "Campaigns", path: "/campaign", icon: "Megaphone" },
        { id: 407, title: "Support Tickets", path: "/ticket", icon: "LifeBuoy" }
      ]
    },

    // --- HRM MANAGEMENT (Group 5) ---
    {
      id: 5,
      title: "HR Management",
      icon: "Briefcase",
      path: "/hr",
      submenu: [
        { id: 501, title: "Dashboard", path: "/hrm/dashboard", icon: "LayoutDashboard" },
        { id: 502, title: "Employees", path: "/employees", icon: "User" },
        { id: 503, title: "Departments", path: "/departments", icon: "Building" },
        { id: 504, title: "Attendance", path: "/attendance", icon: "Clock" },
        { id: 505, title: "Leave Requests", path: "/leave_applications", icon: "FileMinus" },
        { id: 506, title: "Payroll", path: "/payroll", icon: "DollarSign" }
      ]
    },

    // --- FINANCE & ACCOUNTING (Group 6) ---
    {
      id: 6,
      title: "Finance",
      icon: "PieChart",
      path: "/account-management",
      submenu: [
        { id: 601, title: "Dashboard", path: "/accounting/dashboard", icon: "LayoutDashboard" },
        { id: 602, title: "Chart of Accounts", path: "/accounting/chart-of-accounts", icon: "List" },
        { id: 603, title: "Journal Entries", path: "/accounting/journals", icon: "BookOpen" },
        { id: 604, title: "Transactions", path: "/Transactions", icon: "FileText" },
        {
          id: 605,
          title: "Reports",
          path: "/accounting/reports", 
          icon: "FileBarChart",
          submenu: [
            { id: 6051, title: "Balance Sheet", path: "/accounting/reports/balance-sheet", icon: "FileText" },
            { id: 6052, title: "Income Statement", path: "/accounting/reports/income-statement", icon: "FileText" },
            { id: 6053, title: "Trial Balance", path: "/accounting/reports/trial-balance", icon: "FileText" },
            { id: 6054, title: "Aged Payables", path: "/accounting/reports/aged-payables", icon: "FileText" },
            { id: 6055, title: "Aged Receivables", path: "/accounting/reports/aged-receivables", icon: "FileText" }
          ]
        }
      ]
    },

    // --- USER ACCESS (Group 7) ---
    {
      id: 7,
      title: "User Access",
      icon: "Shield",
      path: "/user-management",
      submenu: [
        { id: 701, title: "Users", path: "/users", icon: "User" },
        { id: 702, title: "Roles & Permissions", path: "/roles", icon: "Key" },
        { id: 703, title: "Audit Logs", path: "/audit-logs", icon: "FileText" }
      ]
    },

    // --- SYSTEM SETTINGS (Group 8) ---
    {
      id: 8,
      title: "System Settings",
      icon: "Settings",
      path: "/settings",
      submenu: [
        { id: 801, title: "General", path: "/settings/general", icon: "Sliders" },
        {
          id: 802,
          title: "Inventory Config",
          path: "/inventory-setup",
          icon: "Package",
          submenu: [
            { id: 821, title: "Units", path: "/units" },
            { id: 822, title: "Product Types", path: "/ProductType" },
            { id: 823, title: "Variants", path: "/Variants" }
          ]
        },
        {
          id: 803,
          title: "CRM Config",
          path: "/crm-setup",
          icon: "Users",
          submenu: [
            { id: 831, title: "Lead Sources", path: "/lead-source" },
            { id: 832, title: "Lead Statuses", path: "/lead-status" },
            { id: 833, title: "Pipelines", path: "/opportunity-stage" }
          ]
        },
        {
          id: 804,
          title: "POS Config",
          path: "/pos-setup",
          icon: "CreditCard",
          submenu: [
            { id: 841, title: "Payment Methods", path: "/Payment-Methods" },
            { id: 842, title: "Tax Rates", path: "/tax-rates" },
            { id: 843, title: "Receipt Templates", path: "/receipt-templates" }
          ]
        },
        {
          id: 805,
          title: "HR Config",
          path: "/hr-setup",
          icon: "Briefcase",
          submenu: [
            { id: 851, title: "Designations", path: "/designations" },
            { id: 852, title: "Shifts", path: "/shifts" },
            { id: 853, title: "Leave Types", path: "/leave_types" }
          ]
        }
      ]
    }
  ]
};