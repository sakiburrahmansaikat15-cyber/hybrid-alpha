<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // LIST ALL
    public function index()
    {
        return response()->json(
            Product::with(['category', 'brand', 'subCategory', 'subItem', 'unit', 'productType'])->get()
        );
    }

    // CREATE
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'status'           => 'required|boolean',
            'category_id'      => 'required|exists:categories,id',
            'brand_id'         => 'required|exists:brands,id',
            'sub_category_id'  => 'required|exists:sub_categories,id',
            'sub_item_id'      => 'required|exists:sub_items,id',
            'unit_id'          => 'required|exists:units,id',
            'product_type_id'  => 'required|exists:product_types,id',
            'specifications'   => 'nullable|string',
            'image'            => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->image;
            $filename = time().'_'.$file->getClientOriginalName();
            $file->move(public_path('products'), $filename);
            $validated['image'] = 'products/'.$filename;
        }

        $product = Product::create($validated);

        return response()->json($product, 201);
    }

    // SHOW
    public function show($id)
    {
        $product = Product::with(['category','brand','subCategory','subItem','unit','productType'])->findOrFail($id);
        return response()->json($product);
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'status'           => 'required|boolean',
            'category_id'      => 'required|exists:categories,id',
            'brand_id'         => 'required|exists:brands,id',
            'sub_category_id'  => 'required|exists:sub_categories,id',
            'sub_item_id'      => 'required|exists:sub_items,id',
            'unit_id'          => 'required|exists:units,id',
            'product_type_id'  => 'required|exists:product_types,id',
            'specifications'   => 'nullable|string',
            'image'            => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {

            if ($product->image && file_exists(public_path($product->image))) {
                unlink(public_path($product->image));
            }

            $file = $request->image;
            $filename = time().'_'.$file->getClientOriginalName();
            $file->move(public_path('products'), $filename);

            $validated['image'] = 'products/'.$filename;
        }

        $product->update($validated);

        return response()->json($product);
    }

    // DELETE
    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        if ($product->image && file_exists(public_path($product->image))) {
            unlink(public_path($product->image));
        }

        $product->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    // SEARCH
    public function search(Request $request)
    {
        $search = $request->search;

        $results = Product::where('name', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%")
            ->orWhereHas('category', function($q) use ($search){
                $q->where('name', 'like', "%{$search}%");
            })
            ->get();

        return response()->json($results);
    }
}
