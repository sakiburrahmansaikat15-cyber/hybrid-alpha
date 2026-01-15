<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UnitResource;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UnitController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:units.view')->only(['index', 'show']);
        $this->middleware('permission:units.create')->only(['store']);
        $this->middleware('permission:units.edit')->only(['update']);
        $this->middleware('permission:units.delete')->only(['destroy']);
    }
    // ✅ List units with pagination
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Unit::query();

        // 🔍 Apply search filter if keyword provided
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit, return all results
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Units fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => UnitResource::collection($data),
                ],
            ]);
        }

        // 📄 Otherwise, paginate results
        $limit = (int) $limit ?: 10;
        $units = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Units fetched successfully',
            'pagination' => [
                'current_page' => $units->currentPage(),
                'per_page' => $units->perPage(),
                'total_items' => $units->total(),
                'total_pages' => $units->lastPage(),
                'data' => UnitResource::collection($units),
            ],
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
            'status' => 'sometimes|in:active,inactive',
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


}
