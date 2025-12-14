<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendenceController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Attendance::query();

        if ($keyword) {
            $query->whereDate('date', $keyword);
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Attendance fetched successfully',
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
        $attendances = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Attendance fetched successfully',
            'pagination' => [
                'current_page' => $attendances->currentPage(),
                'per_page' => $attendances->perPage(),
                'total_items' => $attendances->total(),
                'total_pages' => $attendances->lastPage(),
                'data' => $attendances->items(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id'   => 'required|exists:employees,id',
            'date'          => 'required|date',
            'clock_in'      => 'nullable|date_format:H:i',
            'clock_out'     => 'nullable|date_format:H:i',
            'late'          => 'boolean',
            'early_leave'   => 'boolean',
            'working_hours' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $attendance = Attendance::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Attendance created successfully',
            'data' => $attendance
        ], 201);
    }

    public function show($id)
    {
        $attendance = Attendance::find($id);

        if (!$attendance) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $attendance
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $attendance = Attendance::findOrFail($id);

        $data = $request->validate([
            'employee_id'   => 'sometimes|exists:employees,id',
            'date'          => 'sometimes|date',
            'clock_in'      => 'nullable|date_format:H:i',
            'clock_out'     => 'nullable|date_format:H:i',
            'late'          => 'boolean',
            'early_leave'   => 'boolean',
            'working_hours' => 'nullable|numeric',
        ]);

        $attendance->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Attendance updated successfully',
            'data' => $attendance
        ], 200);
    }

    public function destroy($id)
    {
        $attendance = Attendance::find($id);

        if (!$attendance) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance not found'
            ], 404);
        }

        $attendance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance deleted successfully'
        ], 200);
    }
}