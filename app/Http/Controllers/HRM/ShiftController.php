<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\Shift;
use App\Http\Resources\ShiftResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Shift::query();

        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Shifts fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => ShiftResource::collection($data),
                ],
            ]);
        }

        $limit = (int) $limit ?: 10;
        $shifts = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Shifts fetched successfully',
            'pagination' => [
                'current_page' => $shifts->currentPage(),
                'per_page' => $shifts->perPage(),
                'total_items' => $shifts->total(),
                'total_pages' => $shifts->lastPage(),
                'data' => ShiftResource::collection($shifts),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/'],
            'end_time' => ['required', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/'],
            'grace_time' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $shift = Shift::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Shift created successfully',
            'data' => new ShiftResource($shift)
        ], 201);
    }

    public function show($id)
    {
        $shift = Shift::find($id);

        if (!$shift) {
            return response()->json([
                'success' => false,
                'message' => 'Shift not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ShiftResource($shift)
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $shift = Shift::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:255'],
            'start_time' => ['sometimes', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/'],
            'end_time' => ['sometimes', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/'],
            'grace_time' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $shift->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Shift updated successfully',
            'data' => new ShiftResource($shift)
        ], 200);
    }

    public function destroy($id)
    {
        $shift = Shift::find($id);

        if (!$shift) {
            return response()->json([
                'success' => false,
                'message' => 'Shift not found'
            ], 404);
        }

        $shift->delete();

        return response()->json([
            'success' => true,
            'message' => 'Shift deleted successfully'
        ], 200);
    }
}
