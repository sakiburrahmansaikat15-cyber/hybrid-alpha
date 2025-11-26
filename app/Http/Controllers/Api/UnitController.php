<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UnitResource;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UnitController extends Controller
{
    // ✅ List units with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 10);
        $page = (int) $request->query('page', 1);

        $units = Unit::latest()->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Units fetched successfully',
            'page' => $units->currentPage(),
            'perPage' => $units->perPage(),
            'totalItems' => $units->total(),
            'totalPages' => $units->lastPage(),
            'data' => UnitResource::collection($units->items()),
        ]);
    }

    // ✅ Store a new unit
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $unit = Unit::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Unit created successfully',
            'data' => new UnitResource($unit)
        ], 201);
    }

    // ✅ Show a single unit
    public function show($id)
    {
        $unit = Unit::find($id);

        if (!$unit) {
            return response()->json([
                'success' => false,
                'message' => 'Unit not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new UnitResource($unit)
        ], 200);
    }

    // ✅ Update a unit
    public function update(Request $request, $id)
    {
        $unit = Unit::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        $unit->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Unit updated successfully',
            'data' => new UnitResource($unit)
        ], 200);
    }

    // ✅ Delete a unit
    public function destroy($id)
    {
        $unit = Unit::find($id);

        if (!$unit) {
            return response()->json([
                'success' => false,
                'message' => 'Unit not found'
            ], 404);
        }

        $unit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Unit deleted successfully'
        ], 200);
    }

    // ✅ Search units (no pagination)
    public function search(Request $request)
    {
        $keyword = $request->query('keyword', '');

        $units = Unit::where('name', 'like', "%{$keyword}%")
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Search results fetched successfully',
            'data' => UnitResource::collection($units),
        ]);
    }
}
