<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductTypeController extends Controller
{
    // LIST
    public function index(): JsonResponse
    {
        $types = ProductType::select('id', 'type', 'status', 'meta', 'created_at')->get();

        return response()->json([
            'success' => true,
            'count' => $types->count(),
            'data' => $types
        ]);
    }

    // CREATE
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|max:255|unique:product_types,type',
            'status' => 'required|boolean',
            'meta' => 'nullable|array',
        ]);

        $type = ProductType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product type created successfully',
            'data' => $type
        ], 201);
    }

    // SHOW
    public function show($id): JsonResponse
    {
        $type = ProductType::find($id);

        if (!$type) {
            return response()->json([
                'success' => false,
                'message' => 'Product type not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $type
        ]);
    }

    // UPDATE
    public function update(Request $request, $id): JsonResponse
    {
        $type = ProductType::find($id);

        if (!$type) {
            return response()->json([
                'success' => false,
                'message' => 'Product type not found'
            ], 404);
        }

        $validated = $request->validate([
            'type' => 'sometimes|string|max:255|unique:product_types,type,' . $id,
            'status' => 'sometimes|boolean',
            'meta' => 'nullable|array',
        ]);

        $type->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product type updated successfully',
            'data' => $type
        ]);
    }

    // DELETE
    public function destroy($id): JsonResponse
    {
        $type = ProductType::find($id);

        if (!$type) {
            return response()->json([
                'success' => false,
                'message' => 'Product type not found'
            ], 404);
        }

        $type->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product type deleted successfully',
            'deleted_id' => (int)$id
        ]);
    }
}
