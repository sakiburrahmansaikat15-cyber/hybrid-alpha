<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VariantsResource;
use App\Models\variants;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VariantController extends Controller
{
    // ✅ List variants with search + pagination
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = (int) $request->query('limit', 10);

        $query = variants::with('product');

       
        if (!empty($keyword)) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhereHas('product', function ($q) use ($keyword) {
                      $q->where('name', 'like', "%{$keyword}%");
                  });
            });
        }

        // 📄 Paginate results
        $variants = $query->latest()->paginate($limit);

        // ✅ Response
        return response()->json([
            'message' => 'Variants fetched successfully',
            'pagination' => [
                'current_page' => $variants->currentPage(),
                'per_page' => $variants->perPage(),
                'total_items' => $variants->total(),
                'total_pages' => $variants->lastPage(),
                 'data' => VariantsResource::collection($variants),
            ],
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
                'errors' => $validator->errors(),
            ], 422);
        }

        $variant = variants::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Variant created successfully',
            'data' => new VariantsResource($variant),
        ], 201);
    }

    // ✅ Show a single variant
    public function show($id)
    {
        $variant = variants::with('product')->find($id);

        if (!$variant) {
            return response()->json([
                'success' => false,
                'message' => 'Variant not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new VariantsResource($variant),
        ], 200);
    }

    // ✅ Update a variant
    public function update(Request $request, $id)
    {
        $variant = variants::find($id);

        if (!$variant) {
            return response()->json([
                'success' => false,
                'message' => 'Variant not found',
            ], 404);
        }

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
            'data' => new VariantsResource($variant),
        ], 200);
    }

    // ✅ Delete a variant
    public function destroy($id)
    {
        $variant = variants::find($id);

        if (!$variant) {
            return response()->json([
                'success' => false,
                'message' => 'Variant not found',
            ], 404);
        }

        $variant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Variant deleted successfully',
        ], 200);
    }
}
