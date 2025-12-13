<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\LeaveApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeaveApplicationController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = LeaveApplication::query();

        if ($keyword) {
            $query->whereDate('start_date', $keyword)
                  ->orWhereDate('end_date', $keyword);
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Leave applications fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => $data,
                ],
            ]);
        }

        $limit = (int) $limit ?: 10;
        $applications = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Leave applications fetched successfully',
            'pagination' => [
                'current_page' => $applications->currentPage(),
                'per_page' => $applications->perPage(),
                'total_items' => $applications->total(),
                'total_pages' => $applications->lastPage(),
                'data' => $applications->items(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id'    => 'required|exists:employees,id',
            'leave_type_id'  => 'required|exists:leave_types,id',
            'start_date'     => 'required|date',
            'end_date'       => 'required|date|after_or_equal:start_date',
            'reason'         => 'nullable|string',
            'status'         => 'nullable|in:pending,approved,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $application = LeaveApplication::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Leave application created successfully',
            'data' => $application
        ], 201);
    }

    public function show($id)
    {
        $application = LeaveApplication::find($id);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Leave application not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $application
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $application = LeaveApplication::findOrFail($id);

        $data = $request->validate([
            'employee_id'    => 'sometimes|exists:employees,id',
            'leave_type_id'  => 'sometimes|exists:leave_types,id',
            'start_date'     => 'sometimes|date',
            'end_date'       => 'sometimes|date|after_or_equal:start_date',
            'reason'         => 'nullable|string',
            'status'         => 'sometimes|in:pending,approved,rejected',
        ]);

        $application->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Leave application updated successfully',
            'data' => $application
        ], 200);
    }

    public function destroy($id)
    {
        $application = LeaveApplication::find($id);

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Leave application not found'
            ], 404);
        }

        $application->delete();

        return response()->json([
            'success' => true,
            'message' => 'Leave application deleted successfully'
        ], 200);
    }
}
