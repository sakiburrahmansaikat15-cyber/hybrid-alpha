<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\Attendance;
use App\Models\HRM\Department;
use App\Models\HRM\Employee;
use App\Models\HRM\LeaveApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HrmDashboardController extends Controller
{
    /**
     * Get aggregated stats for the HRM Dashboard.
     */
    public function index()
    {
        $today = Carbon::today()->toDateString();
        $startOfWeek = Carbon::now()->startOfWeek()->toDateString();
        $endOfWeek = Carbon::now()->endOfWeek()->toDateString();

        // 📊 Basic Counters
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::where('status', 'active')->count();
        $totalDepartments = Department::count();

        // 🕒 Attendance Stats for Today
        $presentToday = Attendance::where('date', $today)->count();

        $absentToday = $activeEmployees - $presentToday;

        // 🗓️ Leave Stats
        $onLeaveToday = LeaveApplication::where('status', 'approved')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->count();

        $pendingLeaves = LeaveApplication::where('status', 'pending')->count();

        // 📈 Attendance Trend (Last 7 Days)
        $attendanceTrend = Attendance::select('date', DB::raw('count(*) as count'))
            ->where('date', '>', Carbon::now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        // 🏢 Department Distribution
        $departmentDistribution = Employee::select('department_id', DB::raw('count(*) as count'))
            ->with('department:id,name')
            ->groupBy('department_id')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->department->name ?? 'Unassigned',
                    'count' => $item->count
                ];
            });

        // 🚻 Gender Distribution
        $genderDistribution = Employee::select('gender', DB::raw('count(*) as count'))
            ->groupBy('gender')
            ->get();

        // 🆕 Recent Hires (Last 5)
        $recentHires = Employee::with(['department', 'designation'])
            ->orderBy('join_date', 'DESC')
            ->limit(5)
            ->get();

        // 🎂 Upcoming Birthdays (Next 30 days)
        $upcomingBirthdays = Employee::whereRaw("DATE_FORMAT(date_of_birth, '%m-%d') BETWEEN ? AND ?", [
            Carbon::now()->format('m-d'),
            Carbon::now()->addDays(30)->format('m-d')
        ])
            ->orderByRaw("DATE_FORMAT(date_of_birth, '%m-%d') ASC")
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'HRM Dashboard data fetched successfully',
            'data' => [
                'counters' => [
                    'total_employees' => $totalEmployees,
                    'active_employees' => $activeEmployees,
                    'total_departments' => $totalDepartments,
                    'present_today' => $presentToday,
                    'absent_today' => $absentToday,
                    'on_leave_today' => $onLeaveToday,
                    'pending_leaves' => $pendingLeaves,
                ],
                'trends' => [
                    'attendance' => $attendanceTrend,
                ],
                'distributions' => [
                    'department' => $departmentDistribution,
                    'gender' => $genderDistribution,
                ],
                'recent_hires' => $recentHires,
                'upcoming_birthdays' => $upcomingBirthdays,
            ]
        ]);
    }
}
