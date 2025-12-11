<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductsResource;
use App\Models\Prooducts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    // ✅ List all products with pagination
        public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        // Include related models
          $query = Prooducts::query();


        // 🔍 Apply search if keyword provided
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit, return all results
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Products fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => ProductsResource::collection($data),
                ],
            ]);
        }

        // 📄 Otherwise, paginate results
        $limit = (int) $limit ?: 10;
        $products = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Products fetched successfully',
            'pagination' => [
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total_items' => $products->total(),
                'total_pages' => $products->lastPage(),
                'data' => ProductsResource::collection($products),
            ],
        ]);
    }


    // ✅ Create a new product
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'specification' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'cat_id' => 'nullable|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'sub_cat_id' => 'nullable|exists:sub_categories,id',
            'sub_item_id' => 'nullable|exists:sub_items,id',
            'unit_id' => 'nullable|exists:units,id',
            'product_type_id' => 'nullable|exists:product_types,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // ✅ Handle image upload
        if ($request->hasFile('image')) {
            $folder = public_path('products');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'products/' . $imageName;
        }

        $product = Prooducts::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => new ProductsResource($product)
        ], 201);
    }

    // ✅ Show a single product
    public function show($id)
    {
        $product = Prooducts::with(['category', 'brand','subCategory','subItem','unit','productType'])->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ProductsResource($product)
        ], 200);
    }

    // ✅ Update product
    public function update(Request $request, $id)
    {
        $product = Prooducts::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'specification' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'cat_id' => 'nullable|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'sub_cat_id' => 'nullable|exists:sub_categories,id',
            'sub_item_id' => 'nullable|exists:sub_items,id',
            'unit_id' => 'nullable|exists:units,id',
            'product_type_id' => 'nullable|exists:product_types,id',
        ]);

        // ✅ Handle image update
        if ($request->hasFile('image')) {
            if ($product->image && File::exists(public_path($product->image))) {
                File::delete(public_path($product->image));
            }

            $folder = public_path('products');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'products/' . $imageName;
        }

        $product->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => new ProductsResource($product)
        ], 200);
    }

    // ✅ Delete product
    public function destroy($id)
    {
        $product = Prooducts::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        if ($product->image && File::exists(public_path($product->image))) {
            File::delete(public_path($product->image));
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ], 200);
    }
}
