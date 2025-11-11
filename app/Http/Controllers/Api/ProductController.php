<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // get all
    public function index()
    {
        return Product::with([
            'category',
            'brand',
            'subCategory',
            'subItem',
            'unit',
            'productType'
        ])->orderBy('id', 'desc')->get();
    }

    // search
    public function search(Request $request)
    {
        $q = $request->search ?? '';

        return Product::with([
            'category',
            'brand',
            'subCategory',
            'subItem',
            'unit',
            'productType'
        ])
            ->where('name', 'like', "%{$q}%")
            ->get();
    }

    // create
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|max:255',
            'image' => 'nullable|image|max:2048'
        ]);

        $data = $request->all();

        // IMAGE UPLOAD
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('products', 'public');
            $data['image'] = 'storage/' . $path;
        }

        $product = Product::create($data);

        return response([
            'message' => 'Product created successfully',
            'data' => $product
        ], 201);
    }

    // update
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'name' => 'required|max:255',
            'image' => 'nullable|image|max:2048'
        ]);

        $data = $request->all();

        // IMAGE UPDATE
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('products', 'public');
            $data['image'] = 'storage/' . $path;
        }

        $product->update($data);

        return response([
            'message' => 'Product updated successfully',
            'data' => $product
        ]);
    }

    // delete
    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        $product->delete();

        return response(['message' => 'Product deleted']);
    }
}
