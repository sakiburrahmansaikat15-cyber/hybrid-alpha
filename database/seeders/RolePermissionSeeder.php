<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define Permission Groups
        $modules = [
            'users' => ['view', 'create', 'edit', 'delete'],
            'roles' => ['view', 'create', 'edit', 'delete'],
            'audit_logs' => ['view'],

            'inventory' => ['view_dashboard', 'view_reports'],
            'products' => ['view', 'create', 'edit', 'delete'],
            'stocks' => ['view', 'create', 'edit', 'delete'],
            'warehouses' => ['view', 'create', 'edit', 'delete'],
            'brands' => ['view', 'create', 'edit', 'delete'],
            'categories' => ['view', 'create', 'edit', 'delete'],
            'units' => ['view', 'create', 'edit', 'delete'],
            'vendors' => ['view', 'create', 'edit', 'delete'],

            'hrm' => ['view_dashboard', 'view_reports'],
            'employees' => ['view', 'create', 'edit', 'delete'],
            'attendance' => ['view', 'create', 'edit', 'delete'],
            'payroll' => ['view', 'create', 'edit', 'delete'],
            'departments' => ['view', 'create', 'edit', 'delete'],
            'designations' => ['view', 'create', 'edit', 'delete'],
            'leaves' => ['view', 'create', 'edit', 'delete'],

            'crm' => ['view_dashboard'],
            'leads' => ['view', 'create', 'edit', 'delete'],
            'customers' => ['view', 'create', 'edit', 'delete'],
            'companies' => ['view', 'create', 'edit', 'delete'],
            'opportunities' => ['view', 'create', 'edit', 'delete'],
            'campaigns' => ['view', 'create', 'edit', 'delete'],
            'tickets' => ['view', 'create', 'edit', 'delete'],

            'pos' => ['view_dashboard', 'access_terminal'],
            'sales' => ['view', 'create', 'edit', 'delete'],
            'terminals' => ['view', 'create', 'edit', 'delete'],

            'accounting' => ['view_dashboard', 'view_reports'],
            'accounts' => ['view', 'create', 'edit', 'delete'],
            'journals' => ['view', 'create', 'edit', 'delete'],
            'invoices' => ['view', 'create', 'edit', 'delete'],
        ];

        // Flatten permissions list
        $allPermissions = [];
        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                // e.g., 'products.view', 'products.create'
                // EXCEPT if action implies full name like 'view_dashboard'
                if (str_contains($action, '_')) {
                    $allPermissions[] = $module . '.' . $action;
                } else {
                    $allPermissions[] = $module . '.' . $action;
                }
            }
        }

        // --- 1. SUPER ADMIN ---
        // Has generic '*' permission which the middleware should check for (hasPermission logic verifies this)
        Role::updateOrCreate(
            ['name' => 'super_admin'],
            [
                'permissions' => ['*'],
                'accesses' => ['*'],
                'status' => true
            ]
        );

        // --- 2. INVENTORY MANAGER ---
        $invPermissions = $this->getModulePermissions($modules, ['inventory', 'products', 'stocks', 'warehouses', 'brands', 'categories', 'units', 'vendors']);
        Role::updateOrCreate(
            ['name' => 'inventory_manager'],
            [
                'permissions' => $invPermissions,
                'accesses' => ['inventory_dashboard'],
                'status' => true
            ]
        );

        // --- 3. HR MANAGER ---
        $hrPermissions = $this->getModulePermissions($modules, ['hrm', 'employees', 'attendance', 'payroll', 'departments', 'designations', 'leaves']);
        Role::updateOrCreate(
            ['name' => 'hr_manager'],
            [
                'permissions' => $hrPermissions,
                'accesses' => ['hrm_dashboard'],
                'status' => true
            ]
        );

        // --- 4. SALES/POS MANAGER ---
        $posPermissions = $this->getModulePermissions($modules, ['pos', 'sales', 'terminals', 'crm', 'leads', 'customers', 'companies', 'opportunities']);
        Role::updateOrCreate(
            ['name' => 'sales_manager'],
            [
                'permissions' => $posPermissions,
                'accesses' => ['pos_dashboard', 'crm_dashboard'],
                'status' => true
            ]
        );

        // --- 5. ACCOUNTANT ---
        $accPermissions = $this->getModulePermissions($modules, ['accounting', 'accounts', 'journals', 'invoices', 'payroll.view', 'sales.view', 'stocks.view']);
        Role::updateOrCreate(
            ['name' => 'accountant'],
            [
                'permissions' => $accPermissions,
                'accesses' => ['accounting_dashboard'],
                'status' => true
            ]
        );

        // Update default Admin user to Super Admin role
        $superAdminRole = Role::where('name', 'super_admin')->first();
        if ($superAdminRole) {
            User::where('email', 'admin@example.com')->update(['role_id' => $superAdminRole->id]);
        }
    }

    private function getModulePermissions($modules, $targetModules)
    {
        $perms = [];
        foreach ($targetModules as $target) {
            // Handle specific permission reference "module.action"
            if (str_contains($target, '.')) {
                $parts = explode('.', $target);
                $mod = $parts[0];
                $act = $parts[1];
                if (isset($modules[$mod]) && in_array($act, $modules[$mod])) {
                    $perms[] = $mod . '.' . $act;
                }
            }
            // Handle full module reference "module"
            elseif (isset($modules[$target])) {
                foreach ($modules[$target] as $action) {
                    $perms[] = $target . '.' . $action;
                }
            }
        }
        return $perms;
    }
}
