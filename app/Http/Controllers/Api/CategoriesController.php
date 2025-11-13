<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoriesResource;
use App\Models\Categories;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class CategoriesController extends Controller
{
     public function index()
    {
        $categories = Categories::latest()->get();
        return CategoriesResource::collection($categories);
    }

    // ✅ Store a new category
     public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'sometimes|boolean',
        ]);

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $folder = public_path('categories');

            // Create folder if not exists
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }

            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'categories/' . $imageName;
        }

        $category = Categories::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'data' => new CategoriesResource($category)
        ], 201);
    }

    // ✅ Show a single category
    public function show($id)
    {
        $category = Categories::findOrFail($id);
        return new CategoriesResource($category);
    }

    // ✅ Update category
  public function update(Request $request, $id)
    {
        $category = Categories::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'sometimes|boolean',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($category->image && File::exists(public_path($category->image))) {
                File::delete(public_path($category->image));
            }

            $image = $request->file('image');
            $folder = public_path('categories');

            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }

            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'categories/' . $imageName;
        }

        $category->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => new CategoriesResource($category)
        ], 200);
    }

    // ✅ Delete category
    public function destroy($id)
    {
        $category = Categories::findOrFail($id);

        // Delete image if exists
        if ($category->image && File::exists(public_path($category->image))) {
            File::delete(public_path($category->image));
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully'
        ]);
    }
}
