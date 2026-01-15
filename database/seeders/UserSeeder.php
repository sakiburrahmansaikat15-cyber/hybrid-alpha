<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure an Admin Role exists (using the one found in DB or creating one)
        $role = Role::firstOrCreate(
            ['name' => 'admin'],
            [
                'permissions' => ["read", "write", "delete", "update", "create", "export", "import", "manage_users", "manage_roles", "view_reports", "manage_settings"],
                'accesses' => ["admin_panel", "user_management", "role_management", "content_management", "reporting", "system_settings", "audit_logs", "api_access", "dashboard"],
                'status' => true
            ]
        );

        // Create Default Admin User
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make(env('ADMIN_PASSWORD', 'password')),
                'role_id' => $role->id,
                'status' => true,
            ]
        );
    }
}
