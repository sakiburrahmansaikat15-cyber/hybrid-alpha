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
      title: "Projects",
      icon: "FolderOpen",
      path: "/projects",
      submenu: [
        {
          id: 21,
          title: "Roles",
          path: "/roles",
          description: "View all your projects",
          icon: "Folder"
        },
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
          id: 30,
          title: "Vendor",
          path: "/Vendor",
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
          id: 33,
          title: "Products",
          path: "/Products",
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
        {
          id: 35,
          title: "Stocks",
          path: "/Stocks",
          description: "View all your projects",
          icon: "Folder"
        },
        {
          id: 36,
          title: "Transactions",
          path: "/Transactions",
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
        {
          id: 22,
          title: "Create New",
          path: "/projects/new",
          description: "Start a new project",
          badge: "Pro",
          icon: "FileText"
        },
        {
          id: 23,
          title: "Templates",
          path: "/projects/templates",
          description: "Use pre-built templates",
          icon: "LayoutDashboard"
        }
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
      id: 3,
      title: "User",
      icon: "Users",
      path: "/users",
      submenu: [
        {
          id: 31,
          title: "Users",
          path: "/users/all",
          description: "Manage users",
          icon: "User"
        },
        {
          id: 32,
          title: "Roles & Permissions",
          path: "/team/roles",
          description: "Configure access levels",
          icon: "Shield"
        },
        {
          id: 33,
          title: "Activity",
          path: "/team/activity",
          description: "Team activity log",
          icon: "BarChart3"
        }
      ]
    },
    {
      id: 4,
      title: "Calendar",
      icon: "CalendarDays",
      path: "/calendar",
      badge: "3"
    },
    {
      id: 5,
      title: "Documents",
      icon: "FileSearch",
      path: "/documents",
      submenu: [
        {
          id: 51,
          title: "All Documents",
          path: "/documents/all",
          description: "Browse all files",
          icon: "Folder"
        },
        {
          id: 52,
          title: "Shared",
          path: "/documents/shared",
          description: "Shared with you",
          badge: "12",
          icon: "Users"
        },
        {
          id: 53,
          title: "Recent",
          path: "/documents/recent",
          description: "Recently accessed",
          icon: "Clock"
        }
      ]
    },
    {
      id: 6,
      title: "Analytics",
      icon: "PieChart",
      path: "/analytics",
      submenu: [
        {
          id: 61,
          title: "Overview",
          path: "/analytics/overview",
          description: "Performance summary",
          icon: "BarChart3"
        },
        {
          id: 62,
          title: "Reports",
          path: "/analytics/reports",
          description: "Detailed reports",
          icon: "FileText"
        }
      ]
    },
    {
      id: 7,
      title: "Settings",
      icon: "Settings2",
      path: "/settings",
      submenu: [
        {
          id: 71,
          title: "Profile",
          path: "/settings/profile",
          description: "Personal settings",
          icon: "User"
        },
        {
          id: 72,
          title: "Notifications",
          path: "/settings/notifications",
          description: "Configure alerts",
          icon: "Bell"
        },
        {
          id: 73,
          title: "Security",
          path: "/settings/security",
          description: "Privacy & security",
          icon: "Shield"
        }
      ]
    },
    {
      id: 8,
      title: "Test 002",
      icon: "Settings2",
      path: "/settings",
      submenu: [
        {
          id: 81,
          title: "Profile",
          path: "/settings/profile",
          description: "Personal settings",
          icon: "User"
        },
        {
          id: 82,
          title: "Notifications",
          path: "/settings/notifications",
          description: "Configure alerts",
          icon: "Bell"
        },
        {
          id: 83,
          title: "Security",
          path: "/settings/security",
          description: "Privacy & security",
          icon: "Shield"
        }
      ]
    },
    {
      id: 9,
      title: "Test 002",
      icon: "Settings2",
      path: "/settings",
      submenu: [
        {
          id: 91,
          title: "Profile",
          path: "/settings/profile",
          description: "Personal settings",
          icon: "User"
        },
        {
          id: 92,
          title: "Notifications",
          path: "/settings/notifications",
          description: "Configure alerts",
          icon: "Bell"
        },
        {
          id: 93,
          title: "Security",
          path: "/settings/security",
          description: "Privacy & security",
          icon: "Shield"
        }
      ]
    }
  ]
};