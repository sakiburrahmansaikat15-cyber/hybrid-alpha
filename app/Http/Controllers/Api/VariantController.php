<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VariantsResource;
use App\Models\variants;
use Illuminate\Http\Request;

class VariantController extends Controller
{
    // List all variants
    public function index()
    {
        $variants = variants::get();
        return VariantsResource::collection($variants);
    }

    // Store a new variant
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'value' => 'required|string|max:255',
             'status' => 'required|in:active,inactive',
            'product_id' => 'required|exists:prooducts,id',
        ]);

        $variant = variants::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Variant created successfully',
            'data' => new VariantsResource($variant)
        ], 201);
    }

    // Show a single variant
    public function show($id)
    {
        $variant = variants::findOrFail($id);
        return new VariantsResource($variant);
    }

    // Update a variant
    public function update(Request $request, $id)
    {
        $variant = variants::findOrFail($id);


        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'value' => 'sometimes|string|max:255',
            'status' => 'required|in:active,inactive',
            'product_id' => 'sometimes|exists:prooducts,id',
        ]);

        $variant->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Variant updated successfully',
            'data' => new VariantsResource($variant)
        ], 200);
    }

    // Delete a variant
    public function destroy($id)
    {
        $variant = variants::findOrFail($id);
        $variant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Variant deleted successfully'
        ]);
    }
}
