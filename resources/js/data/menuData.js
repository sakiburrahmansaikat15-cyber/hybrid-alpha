// data/menuData.js
export const menuData = {
  menuItems: [
    {
      id: 1,
      title: "Dashboard",
      icon: "LayoutDashboard",
      path: "/",
      badge: "New"
    },
    {
      id: 2,
       title: "Inventory-Setup",
      icon: "FolderOpen",
      path: "/inventory-setup",
      submenu: [
        {
          id: 24,
          title: "units",
          path: "/units",
          description: "View all your projects",
          icon: "Folder"
        },
        {
          id: 25,
          title: "categories",
          path: "/categories",
          description: "View all your projects",
          icon: "Folder"
        },
        {
          id: 26,
          title: "ProductType",
          path: "/ProductType",
          description: "View all your projects",
          icon: "Folder"
        },
        {
          id: 27,
          title: "Brands",
          path: "/Brands",
          description: "View all your projects",
          icon: "Folder"
        },
        {
          id: 28,
          title: "PaymentTypes",
          path: "/PaymentTypes",
          description: "View all your projects",
          icon: "Folder"
        },
        {
          id: 29,
          title: "Warehouses",
          path: "/Warehouses",
          description: "View all your projects",
          icon: "Folder"
        },

        {
          id: 31,
          title: "SubCategories",
          path: "/SubCategories",
          description: "View all your projects",
          icon: "Folder"
        },
        {
          id: 32,
          title: "Subitems",
          path: "/Subitems",
          description: "View all your projects",
          icon: "Folder"
        },

        {
          id: 34,
          title: "Variants",
          path: "/Variants",
          description: "View all your projects",
          icon: "Folder"
        },
      ]
    },
    {
      id: 3,
       title: "Inventory",
      icon: "FolderOpen",
      path: "/inventory",
      submenu: [

        {
          id: 30,
          title: "Vendor",
          path: "/Vendor",
          description: "View all your projects",
          icon: "Folder"
        },

        {
          id: 33,
          title: "Products",
          path: "/Products",
          description: "View all your projects",
          icon: "Folder"
        },

        {
          id: 35,
          title: "Stocks",
          path: "/Stocks",
          description: "View all your projects",
          icon: "Folder"
        },

        {
          id: 37,
          title: "Serial-List",
          path: "/serial-list",
          description: "View all your projects",
          icon: "Folder"
        },
      ]
    },
    {
      id: 10,
      title: "HR Management",
      icon: "Users",
      path: "/hr",
      submenu: [
        {
          id: 101,
          title: "Employees",
          path: "/employees",
          description: "Manage employee records",
          icon: "User"
        },
        {
          id: 102,
          title: "Departments",
          path: "/departments",
          description: "Manage departments",
          icon: "Building"
        },
        {
          id: 103,
          title: "Designations",
          path: "/designations",
          description: "Manage job titles",
          icon: "Briefcase"
        },
        {
          id: 104,
          title: "Employee Documents",
          path: "/employee_documents",
          description: "Employee documentation",
          icon: "FileText"
        },
        {
          id: 105,
          title: "Attendance",
          path: "/attendance",
          description: "Track employee attendance",
          icon: "Clock"
        },
        {
          id: 106,
          title: "Shifts",
          path: "/shifts",
          description: "Manage work shifts",
          icon: "CalendarClock"
        },
        {
          id: 107,
          title: "Leave Types",
          path: "/leave_types",
          description: "Configure leave types",
          icon: "CalendarCheck"
        },
        {
          id: 108,
          title: "Leave Applications",
          path: "/leave_applications",
          description: "Manage leave requests",
          icon: "FileCheck"
        },
        {
          id: 109,
          title: "Salaries",
          path: "/salaries",
          description: "Employee salary details",
          icon: "DollarSign"
        },
        {
          id: 110,
          title: "Payroll",
          path: "/payroll",
          description: "Process payroll",
          icon: "CreditCard"
        }
      ]
    },
      {
      id: 11,
      title: "CRM Management",
      icon: "Users",
      path: "/crm",
      submenu: [
        {
          id: 101,
          title: "Lead",
          path: "/lead",
          icon: "User"
        },
        {
          id: 102,
          title: "Lead-Source",
          path: "/lead-source",
          icon: "Building"
        },
        {
          id: 103,
          title: "Lead-Status",
          path: "/lead-status",

          icon: "Briefcase"
        },
        {
          id: 104,
          title: "Customer",
          path: "/customer",

          icon: "FileText"
        },
        {
          id: 105,
          title: "Company",
          path: "/company",

          icon: "Clock"
        },
        {
          id: 106,
          title: "Contact",
          path: "/contact",

          icon: "CalendarClock"
        },
        {
          id: 107,
          title: "Opportunity",
          path: "/opportunity",

          icon: "CalendarCheck"
        },
        {
          id: 108,
          title: "Opportunity-Stage",
          path: "/opportunity-stage",

          icon: "FileCheck"
        },
        {
          id: 109,
          title: "Activity",
          path: "/activity",

          icon: "DollarSign"
        },
        {
          id: 110,
          title: "Campaign",
          path: "/campaign",

          icon: "CreditCard"
        },
        {
          id: 111,
          title: "Ticket",
          path: "/ticket",

          icon: "CreditCard"
        }
      ]
    },
    {
      id: 12,
      title: "POS Management",
      icon: "Users",
      path: "/pos",
      submenu: [
        {
          id: 101,
          title: "Pos-Terminals",
          path: "/pos-terminals",
          icon: "User"
        },
        {
          id: 102,
          title: "Pos-Sessions",
          path: "/pos-sessions",
          icon: "Building"
        },
        {
          id: 103,
          title: "Sales",
          path: "/sales",

          icon: "Briefcase"
        },
        {
          id: 104,
          title: "Sale-Items",
          path: "/sale-items",

          icon: "FileText"
        },
        {
          id: 105,
          title: "Sale-Payments",
          path: "/sale-payments",

          icon: "Clock"
        },
        {
          id: 106,
          title: "Sale-Taxes",
          path: "/sale-taxes",

          icon: "CalendarClock"
        },
        {
          id: 107,
          title: "Sale-Discounts",
          path: "/sale-discounts",

          icon: "CalendarCheck"
        },
        {
          id: 108,
          title: "Customers",
          path: "/customers",

          icon: "FileCheck"
        },
        {
          id: 109,
          title: "Customer-Groups",
          path: "/customer-groups",

          icon: "DollarSign"
        },
        {
          id: 110,
          title: "Customer-Addresses",
          path: "/customer-addresses",

          icon: "CreditCard"
        },
        {
          id: 111,
          title: "Hold-Carts",
          path: "/hold-carts",

          icon: "CreditCard"
        },
         {
          id: 112,
          title: "Gift-Cards",
          path: "/gift-cards",

          icon: "CreditCard"
        },
         {
          id: 113,
          title: "Vouchers",
          path: "/vouchers",

          icon: "CreditCard"
        },
         {
          id: 114,
          title: "Payment-Methods",
          path: "/Payment-Methods",

          icon: "CreditCard"
        },
         {
          id: 115,
          title: "Payment-Gateways",
          path: "/payment-gateways",

          icon: "CreditCard"
        },
         {
          id: 116,
          title: "Receipts",
          path: "/receipts",

          icon: "CreditCard"
        },
         {
          id: 117,
          title: "Receipt-Templates",
          path: "/receipt-templates",

          icon: "CreditCard"
        },
         {
          id: 118,
          title: "Tax-Rates",
          path: "/tax-rates",

          icon: "CreditCard"
        },
          {
          id: 119,
          title: "Tax-Groups",
          path: "/tax-groups",

          icon: "CreditCard"
        },
        {
          id: 119,
          title: "Checkout",
          path: "/checkout",

          icon: "CreditCard"
        }
      ]
    },
    {
      id: 4,
      title: "User-Management",
      icon: "FolderOpen",
      path: "/user-management",
      submenu: [
       {
          id: 21,
          title: "Roles",
          path: "/roles",
          description: "View all your roles",
          icon: "Folder"
        },
        {
          id: 21,
          title: "User",
          path: "/user",
          description: "View all your user",
          icon: "Folder"
        },
      ]
    },
       {
      id: 5,
      title: "Account-Management",
      icon: "FolderOpen",
      path: "/account-management",
      submenu: [
        {
          id: 36,
          title: "Transactions",
          path: "/Transactions",
          description: "View all your projects",
          icon: "Folder"
        }
      ]
    },
  ]
};
