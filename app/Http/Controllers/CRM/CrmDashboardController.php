<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\Lead;
use App\Models\CRM\Opportunity;
use App\Models\CRM\Customer;
use App\Models\CRM\Activity;
use App\Models\CRM\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CrmDashboardController extends Controller
{
    public function index()
    {
        try {
            $stats = [
                'total_leads' => Lead::count(),
                'total_opportunities' => Opportunity::count(),
                'total_customers' => Customer::count(),
                'total_revenue' => Opportunity::sum('value'),
                'open_tickets' => Ticket::where('status', '!=', 'closed')->count(),
            ];

            // Leads by Status
            $leadsByStatus = Lead::join('lead_statuses', 'leads.lead_status_id', '=', 'lead_statuses.id')
                ->select('lead_statuses.name', DB::raw('count(*) as count'))
                ->groupBy('lead_statuses.name')
                ->get();

            // Opportunities by Stage
            $opportunitiesByStage = Opportunity::join('opportunity_stages', 'opportunities.stage_id', '=', 'opportunity_stages.id')
                ->select('opportunity_stages.name', DB::raw('count(*) as count'), DB::raw('sum(value) as total_value'))
                ->groupBy('opportunity_stages.name')
                ->get();

            // Recent Leads
            $recentLeads = Lead::with(['leadSource', 'leadStatus'])
                ->latest()
                ->limit(5)
                ->get();

            // Recent Activities
            $recentActivities = Activity::latest()
                ->limit(5)
                ->get();

            // Monthly Leads for Chart
            $monthlyLeads = Lead::select(
                DB::raw('count(*) as count'),
                DB::raw("DATE_FORMAT(created_at, '%M') as month"),
                DB::raw('MONTH(created_at) as month_num')
            )
                ->whereYear('created_at', date('Y'))
                ->groupBy('month', 'month_num')
                ->orderBy('month_num')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'leads_by_status' => $leadsByStatus,
                    'opportunities_by_stage' => $opportunitiesByStage,
                    'recent_leads' => $recentLeads,
                    'recent_activities' => $recentActivities,
                    'monthly_leads' => $monthlyLeads,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching CRM dashboard data: ' . $e->getMessage()
            ], 500);
        }
    }
}
