<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\LeaveType;
use App\Http\Resources\LeaveTypeResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeaveTypesController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = LeaveType::query();

        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Leave types fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => LeaveTypeResource::collection($data),
                ],
            ]);
        }

        $limit = (int) $limit ?: 10;
        $leaveTypes = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Leave types fetched successfully',
            'pagination' => [
                'current_page' => $leaveTypes->currentPage(),
                'per_page' => $leaveTypes->perPage(),
                'total_items' => $leaveTypes->total(),
                'total_pages' => $leaveTypes->lastPage(),
                'data' => LeaveTypeResource::collection($leaveTypes),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'max_days' => 'required|integer|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $leaveType = LeaveType::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Leave type created successfully',
            'data' => new LeaveTypeResource($leaveType)
        ], 201);
    }

    public function show($id)
    {
        $leaveType = LeaveType::find($id);

        if (!$leaveType) {
            return response()->json([
                'success' => false,
                'message' => 'Leave type not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new LeaveTypeResource($leaveType)
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $leaveType = LeaveType::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'max_days' => 'sometimes|integer|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $leaveType->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Leave type updated successfully',
            'data' => new LeaveTypeResource($leaveType)
        ], 200);
    }

    public function destroy($id)
    {
        $leaveType = LeaveType::find($id);

        if (!$leaveType) {
            return response()->json([
                'success' => false,
                'message' => 'Leave type not found'
            ], 404);
        }

        $leaveType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Leave type deleted successfully'
        ], 200);
    }
}
