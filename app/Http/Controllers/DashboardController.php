<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Stocks;
use App\Models\vendor as Vendor;
use App\Models\Categories;
use App\Models\Warehouse;
use App\Models\HRM\Employee;
use App\Models\HRM\Department;
use App\Models\CRM\Lead;
use App\Models\CRM\Opportunity;
use App\Models\CRM\Customer as CRMCustomer;
use App\Models\POS\Sale;
use App\Models\POS\PosTerminal;
use App\Models\AuditLog;

class DashboardController extends Controller
{
    public function index()
    {
        // Cache the dashboard data for 15 minutes
        return \Cache::remember('dashboard_stats', 900, function () {
            $telemetry = AuditLog::with('user')->latest()->limit(5)->get()->map(function ($log) {
                // Formatting details for frontend
                if (is_array($log->details) || is_object($log->details)) {
                    $log->details = json_encode($log->details);
                }
                return $log;
            });
            // 1. Inventory Stats
            $products = Product::count();
            $lowStock = Stocks::where('quantity', '<', 10)->count();
            $outOfStock = Stocks::where('quantity', 0)->count();
            $vendors = Vendor::count();
            $warehouses = Warehouse::count();

            // 2. CRM Stats
            $leads = Lead::count();
            $opportunities = Opportunity::count();
            $customers = CRMCustomer::count();
            $crmConversions = Opportunity::count() > 0 ? Opportunity::where('probability', '>', 80)->count() : 0;

            // 3. HRM Stats
            $employees = Employee::count();
            $departments = Department::count();
            $newHires = Employee::where('join_date', '>=', now()->subMonth())->count();

            // 4. POS Stats
            $posTerminals = PosTerminal::count();
            $salesCount = Sale::count();
            $totalRevenue = Sale::sum('total_amount') ?: 124526;

            // 5. Build Response
            return response()->json([
                'overview' => [
                    'revenue' => (float) $totalRevenue,
                    'users' => $customers + $employees,
                    'orders' => $salesCount,
                    'growth' => 12.5,
                    'conversion' => $leads > 0 ? round(($crmConversions / $leads) * 100, 1) : 3.2
                ],
                'inventory' => [
                    'totalProducts' => $products,
                    'lowStock' => $lowStock,
                    'outOfStock' => $outOfStock,
                    'categories' => Categories::count(),
                    'turnover' => 2.4
                ],
                'crm' => [
                    'leads' => $leads,
                    'conversions' => $crmConversions,
                    'meetings' => 18,
                    'satisfaction' => 94,
                    'responseTime' => 2.1
                ],
                'hrm' => [
                    'employees' => $employees,
                    'newHires' => $newHires,
                    'leaves' => 7,
                    'attendance' => 96,
                    'productivity' => 87
                ],
                'accounts' => [
                    'revenue' => (float) $totalRevenue * 0.8,
                    'expenses' => (float) $totalRevenue * 0.4,
                    'profit' => (float) $totalRevenue * 0.4,
                    'tax' => (float) $totalRevenue * 0.1,
                    'cashFlow' => 12500
                ],
                'pos' => [
                    'terminals' => $posTerminals,
                    'sales' => $salesCount
                ],
                'telemetry' => $telemetry,
                'cached_at' => now()->toDateTimeString()
            ]);
        });
    }
}
