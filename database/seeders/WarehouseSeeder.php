<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WarehouseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('warehouses')->upsert([
            [
                'name' => 'Main Warehouse',
                'code' => 'WH-001',
                'address' => '123 Main St, New York, NY',
                'phone' => '123-456-7890',
                'email' => 'warehouse1@example.com',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Secondary Warehouse',
                'code' => 'WH-002',
                'address' => '456 Side St, Los Angeles, CA',
                'phone' => '987-654-3210',
                'email' => 'warehouse2@example.com',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Outlet Store',
                'code' => 'WH-003',
                'address' => '789 Market St, Chicago, IL',
                'phone' => '555-123-4567',
                'email' => 'outlet@example.com',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Distribution Center',
                'code' => 'WH-004',
                'address' => '321 Commerce Dr, Houston, TX',
                'phone' => '444-555-6666',
                'email' => 'dist@example.com',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'East Coast Hub',
                'code' => 'WH-005',
                'address' => '654 Atlantic Ave, Boston, MA',
                'phone' => '222-333-4444',
                'email' => 'east@example.com',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['code'], ['name', 'address', 'phone', 'email', 'status', 'updated_at']);
    }
}
