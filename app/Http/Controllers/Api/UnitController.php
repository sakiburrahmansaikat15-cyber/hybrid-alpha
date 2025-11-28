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
         $keyword = $request->query('keyword', '');
        $limit = (int) $request->query('limit', 10);
       

        $query = Unit::query();

        // 🔍 Apply search if keyword provided
      if ($keyword) {
        $query->where('name', 'like', "%{$keyword}%"); 
    }

        // 📄 Paginate results
        $serials = $query->latest()->paginate($limit);

        
        return response()->json([
            'message' => 'Unit fetched successfully',
            'pagination' => [
                'current_page' => $serials->currentPage(),
                'per_page' => $serials->perPage(),
                'total_items' => $serials->total(),
                'total_pages' => $serials->lastPage(),
                'data' => UnitResource::collection($serials),
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


}
