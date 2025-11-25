<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductTypeResource;
use App\Models\ProductType;
use Illuminate\Http\Request;

class ProductTypeController extends Controller
{
    // List all product types
    public function index()
    {
        $productTypes = ProductType::get();
        return ProductTypeResource::collection($productTypes);
    }

    // Store a new product type
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
          'status' => 'required|in:active,inactive',
        ]);

        $productType = ProductType::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Product type created successfully',
            'data' => new ProductTypeResource($productType)
        ], 201);
    }

    // Show a single product type
    public function show($id)
    {
        $productType = ProductType::findOrFail($id);
        return new ProductTypeResource($productType);
    }

    // Update a product type
    public function update(Request $request, $id)
    {
        $productType = ProductType::findOrFail($id);


        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        $productType->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Product type updated successfully',
            'data' => new ProductTypeResource($productType)
        ], 200);
    }

    // Delete a product type
    public function destroy($id)
    {
        $productType = ProductType::findOrFail($id);
        $productType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product type deleted successfully'
        ]);
    }
}
