<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Example:
        // \App\Models\User::factory(10)->create();
        // \App\Models\User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        $this->call([
            CategorySeeder::class,
            SubCategorySeeder::class,
            UnitSeeder::class,
            SubItemSeeder::class,
            ProductTypeSeeder::class,
            BrandSeeder::class,
            PaymentTypeSeeder::class, 
            ProoductSeeder::class,
            VendorSeeder::class,
            StockSeeder::class,
            SerialListSeeder::class,
            DepartmentSeeder::class,
        DesignationSeeder::class,
        EmployeeSeeder::class,
        EmployeeDocumentSeeder::class,
        ShiftSeeder::class,
        AttendanceSeeder::class,
        LeaveTypeSeeder::class,
        LeaveApplicationSeeder::class,
        SalarySeeder::class,
        PayrollSeeder::class,
         LeadSourceSeeder::class,
            LeadStatusSeeder::class,
            OpportunityStageSeeder::class,
            CompanySeeder::class,
            CustomerSeeder::class,
            ContactSeeder::class,
            LeadSeeder::class,
            OpportunitySeeder::class,
            TicketSeeder::class,
            CampaignSeeder::class,
            ActivitySeeder::class,
            CustomerGroupSeeder::class,
            CustomersSeeder::class,
            CustomerAddressSeeder::class,
            PosTerminalSeeder::class,
            PosSessionSeeder::class,
            PaymentMethodSeeder::class,
            PaymentGatewaySeeder::class,
            GiftCardSeeder::class,
            TaxRateSeeder::class,
            ReceiptTemplateSeeder::class,
            TaxGroupSeeder::class,
        ]);
    }
}
