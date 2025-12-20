<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WarehouseController extends Controller
{
    // ✅ List warehouses with search and pagination
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Warehouse::query();

        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%")
                  ->orWhere('code', 'like', "%{$keyword}%")
                  ->orWhere('type', 'like', "%{$keyword}%");
        }

        if (!$limit) {
            $data = $query->latest()->get();
            return response()->json([
                'message' => 'Warehouses fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => $data,
                ],
            ]);
        }

        $limit = (int)$limit ?: 10;
        $warehouses = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Warehouses fetched successfully',
            'pagination' => [
                'current_page' => $warehouses->currentPage(),
                'per_page' => $warehouses->perPage(),
                'total_items' => $warehouses->total(),
                'total_pages' => $warehouses->lastPage(),
                'data' => $warehouses->items(),
            ],
        ]);
    }

    // ✅ Store a new warehouse
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'           => 'required|string|max:255',
            'code'           => 'required|string|max:50|unique:warehouses,code',
            'type'           => 'nullable|string|max:50',
            'contact_person' => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:255',
            'address'        => 'nullable|string',
            'country'        => 'nullable|string|max:100',
            'state'          => 'nullable|string|max:100',
            'city'           => 'nullable|string|max:100',
            'capacity'       => 'nullable|integer|min:0',
            'is_default'     => 'nullable|boolean',
            'status'         => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $warehouse = Warehouse::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Warehouse created successfully',
            'data' => $warehouse
        ], 201);
    }

    // ✅ Show single warehouse
    public function show($id)
    {
        $warehouse = Warehouse::find($id);

        if (!$warehouse) {
            return response()->json([
                'success' => false,
                'message' => 'Warehouse not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $warehouse
        ], 200);
    }

    // ✅ Update warehouse
    public function update(Request $request, $id)
    {
        $warehouse = Warehouse::findOrFail($id);

        $data = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'code'           => 'sometimes|string|max:50|unique:warehouses,code,' . $warehouse->id,
            'type'           => 'sometimes|string|max:50',
            'contact_person' => 'sometimes|string|max:255',
            'phone'          => 'sometimes|string|max:20',
            'email'          => 'sometimes|email|max:255',
            'address'        => 'sometimes|string',
            'country'        => 'sometimes|string|max:100',
            'state'          => 'sometimes|string|max:100',
            'city'           => 'sometimes|string|max:100',
            'capacity'       => 'sometimes|integer|min:0',
            'is_default'     => 'sometimes|boolean',
            'status'         => 'sometimes|in:active,inactive',
        ]);

        $warehouse->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Warehouse updated successfully',
            'data' => $warehouse
        ], 200);
    }

    // ✅ Delete warehouse
    public function destroy($id)
    {
        $warehouse = Warehouse::find($id);

        if (!$warehouse) {
            return response()->json([
                'success' => false,
                'message' => 'Warehouse not found'
            ], 404);
        }

        $warehouse->delete();

        return response()->json([
            'success' => true,
            'message' => 'Warehouse deleted successfully'
        ], 200);
    }
}
