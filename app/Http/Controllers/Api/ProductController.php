<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductsResource;
use App\Models\Prooducts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ProductController extends Controller
{
    // List all products
    public function index()
    {
        $products = Prooducts::get();
        return ProductsResource::collection($products);
    }

    // Store a new product
    public function store(Request $request)
    {
        $data = $request->validate([
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

        // Handle image upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $folder = public_path('products');

            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }

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

    // Show a single product
    public function show($id)
    {
        $product = Prooducts::findOrFail($id);
        return new ProductsResource($product);
    }

    // Update a product
    public function update(Request $request, $id)
    {
        $product = Prooducts::findOrFail($id);

            if ($request->has('status')) {
        if ($request->status === 'active') $request->merge(['status' => true]);
        if ($request->status === 'inactive') $request->merge(['status' => false]);
    }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
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

        // Handle image update
        if ($request->hasFile('image')) {
            if ($product->image && File::exists(public_path($product->image))) {
                File::delete(public_path($product->image));
            }

            $image = $request->file('image');
            $folder = public_path('products');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }

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

    // Delete a product
    public function destroy($id)
    {
        $product = Prooducts::findOrFail($id);

        // Delete image if exists
        if ($product->image && File::exists(public_path($product->image))) {
            File::delete(public_path($product->image));
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    }
}
