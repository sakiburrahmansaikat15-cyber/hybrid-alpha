<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductTypeResource;
use App\Models\ProductType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductTypeController extends Controller
{
    // ✅ List all product types with pagination
      public function index(Request $request)
    {
         $keyword = $request->query('keyword', '');
        $limit = (int) $request->query('limit', 10);
       

        $query = ProductType::query();

        // 🔍 Apply search if keyword provided
      if ($keyword) {
        $query->where('name', 'like', "%{$keyword}%"); 
    }

        // 📄 Paginate results
        $serials = $query->latest()->paginate($limit);

        
        return response()->json([
            'message' => 'ProductType fetched successfully',
            'pagination' => [
                'current_page' => $serials->currentPage(),
                'per_page' => $serials->perPage(),
                'total_items' => $serials->total(),
                'total_pages' => $serials->lastPage(),
                'data' => ProductTypeResource::collection($serials),
            ],
        ]);
    }

    // ✅ Store a new product type
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
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $productType = ProductType::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Product type created successfully',
            'data' => new ProductTypeResource($productType),
        ], 201);
    }

    // ✅ Show a single product type
    public function show($id)
    {
        $productType = ProductType::find($id);

        if (!$productType) {
            return response()->json([
                'success' => false,
                'message' => 'Product type not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ProductTypeResource($productType),
        ], 200);
    }

    // ✅ Update a product type
    public function update(Request $request, $id)
    {
        $productType = ProductType::find($id);

        if (!$productType) {
            return response()->json([
                'success' => false,
                'message' => 'Product type not found',
            ], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $productType->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Product type updated successfully',
            'data' => new ProductTypeResource($productType),
        ], 200);
    }

    // ✅ Delete a product type
    public function destroy($id)
    {
        $productType = ProductType::find($id);

        if (!$productType) {
            return response()->json([
                'success' => false,
                'message' => 'Product type not found',
            ], 404);
        }

        $productType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product type deleted successfully',
        ], 200);
    }
}
