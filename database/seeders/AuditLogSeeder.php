<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AuditLog;
use App\Models\User;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first();
        if (!$admin)
            return;

        $logs = [
            ['action' => 'LOGIN', 'module' => 'AUTH', 'details' => ['status' => 'success']],
            ['action' => 'CREATE_PRODUCT', 'module' => 'INVENTORY', 'details' => ['sku' => 'ITM-942', 'name' => 'Neural Processor G1']],
            ['action' => 'UPDATE_OPPORTUNITY', 'module' => 'CRM', 'details' => ['id' => 12, 'change' => 'Stage -> Won']],
            ['action' => 'BULK_IMPORT', 'module' => 'HRM', 'details' => ['count' => 50, 'type' => 'Attendance']],
            ['action' => 'STOCK_ALERT', 'module' => 'INVENTORY', 'details' => ['sku' => 'WID-001', 'level' => 2]],
            ['action' => 'NEW_SALE', 'module' => 'POS', 'details' => ['invoice' => 'INV-8821', 'total' => 1240.50]],
        ];

        foreach ($logs as $log) {
            AuditLog::create(array_merge($log, [
                'user_id' => $admin->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            ]));
        }
    }
}
