<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductTypeController extends Controller
{
    /**
     * GET /api/product-types
     */
    public function index(): JsonResponse
    {
        $productTypes = ProductType::select('id', 'type', 'status', 'created_at')->get();
        
        return response()->json([
            'success' => true,
            'data' => $productTypes,
            'count' => $productTypes->count()
        ]);
    }

    /**
     * POST /api/product-types
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|max:255|unique:product_types,type',
            'status' => 'sometimes|in:active,inactive'
        ]);

        $productType = ProductType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product type created successfully',
            'data' => $productType
        ], 201);
    }

    /**
     * GET /api/product-types/{id}
     */
    public function show($id): JsonResponse
    {
        $productType = ProductType::select('id', 'type', 'status', 'created_at', 'updated_at')
            ->find($id);

        if (!$productType) {
            return response()->json([
                'success' => false,
                'message' => 'Product type not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $productType
        ]);
    }

    /**
     * PUT /api/product-types/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $productType = ProductType::find($id);

        if (!$productType) {
            return response()->json([
                'success' => false,
                'message' => 'Product type not found'
            ], 404);
        }

        $validated = $request->validate([
            'type' => 'sometimes|string|max:255|unique:product_types,type,' . $id,
            'status' => 'sometimes|in:active,inactive'
        ]);

        $productType->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product type updated successfully',
            'data' => $productType
        ]);
    }

    /**
     * DELETE /api/product-types/{id}
     */
    public function destroy($id): JsonResponse
    {
        $productType = ProductType::find($id);

        if (!$productType) {
            return response()->json([
                'success' => false,
                'message' => 'Product type not found'
            ], 404);
        }

        $productType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product type deleted successfully',
            'deleted_id' => (int)$id
        ]);
    }
}