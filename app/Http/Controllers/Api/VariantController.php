<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VariantsResource;
use App\Models\variants;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VariantController extends Controller
{
    // ✅ List variants with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 10);
        $page = (int) $request->query('page', 1);

        $variants = variants::latest()->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Variants fetched successfully',
            'page' => $variants->currentPage(),
            'perPage' => $variants->perPage(),
            'totalItems' => $variants->total(),
            'totalPages' => $variants->lastPage(),
            'data' => VariantsResource::collection($variants->items()),
        ]);
    }

    // ✅ Store a new variant
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'value' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
            'product_id' => 'required|exists:prooducts,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $variant = variants::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Variant created successfully',
            'data' => new VariantsResource($variant)
        ], 201);
    }

    // ✅ Show a single variant
    public function show($id)
    {
        $variant = variants::find($id);

        if (!$variant) {
            return response()->json([
                'success' => false,
                'message' => 'Variant not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new VariantsResource($variant)
        ], 200);
    }

    // ✅ Update a variant
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

    // ✅ Delete a variant
    public function destroy($id)
    {
        $variant = variants::find($id);

        if (!$variant) {
            return response()->json([
                'success' => false,
                'message' => 'Variant not found'
            ], 404);
        }

        $variant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Variant deleted successfully'
        ], 200);
    }

    // ✅ Search variants (no pagination)
    public function search(Request $request)
    {
        $keyword = $request->query('keyword', '');

        $variants = variants::where('name', 'like', "%{$keyword}%")
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Search results fetched successfully',
            'data' => VariantsResource::collection($variants),
        ]);
    }
}
