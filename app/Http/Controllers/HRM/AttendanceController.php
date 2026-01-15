<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\HRM\StoreAttendanceRequest;
use App\Http\Requests\HRM\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;

class AttendanceController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:attendance.view')->only(['index', 'show']);
        $this->middleware('permission:attendance.create')->only(['store']);
        $this->middleware('permission:attendance.edit')->only(['update']);
        $this->middleware('permission:attendance.delete')->only(['destroy']);
    }
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Attendance::with('employee');

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
                    'data' => AttendanceResource::collection($data),
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
                'data' => AttendanceResource::collection($attendances),
            ],
        ]);
    }

    public function store(StoreAttendanceRequest $request)
    {
        $attendance = Attendance::create($request->validated());

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

    public function update(UpdateAttendanceRequest $request, $id)
    {
        $attendance = Attendance::findOrFail($id);

        $attendance->update($request->validated());

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
