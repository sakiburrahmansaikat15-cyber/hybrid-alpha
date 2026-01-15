<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\Inventory\StoreWarehouseRequest;
use App\Http\Requests\Inventory\UpdateWarehouseRequest;

class WarehouseController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:warehouses.view')->only(['index', 'show']);
        $this->middleware('permission:warehouses.create')->only(['store']);
        $this->middleware('permission:warehouses.edit')->only(['update']);
        $this->middleware('permission:warehouses.delete')->only(['destroy']);
    }
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

        $limit = (int) $limit ?: 10;
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
    public function store(StoreWarehouseRequest $request)
    {
        $warehouse = Warehouse::create($request->validated());

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
    public function update(UpdateWarehouseRequest $request, $id)
    {
        $warehouse = Warehouse::findOrFail($id);

        $warehouse->update($request->validated());

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
