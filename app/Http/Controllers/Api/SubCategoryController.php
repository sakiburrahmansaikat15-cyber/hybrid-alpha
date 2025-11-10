<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubCategory;
use Illuminate\Http\Request;

class SubCategoryController extends Controller
{
    // LIST ALL
    public function index()
    {
        return response()->json(SubCategory::with('category')->get());
    }

    // CREATE
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'status' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // handle image upload
        if ($request->hasFile('image')) {
            $file = $request->image;
            $fileName = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('sub_category'), $fileName);
            $validated['image'] = 'sub_category/' . $fileName;
        }

        $subCategory = SubCategory::create($validated);

        return response()->json($subCategory, 201);
    }

    // SHOW ONE
    public function show(SubCategory $subCategory)
    {
        return response()->json($subCategory->load('category'));
    }

    // UPDATE
    public function update(Request $request, SubCategory $subCategory)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'status' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // update image if exists
        if ($request->hasFile('image')) {
            // delete old image
            if ($subCategory->image && file_exists(public_path($subCategory->image))) {
                unlink(public_path($subCategory->image));
            }

            $file = $request->image;
            $fileName = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('sub_category'), $fileName);
            $validated['image'] = 'sub_category/' . $fileName;
        }

        $subCategory->update($validated);

        return response()->json($subCategory);
    }

    // DELETE
    public function destroy(SubCategory $subCategory)
    {
        // delete image
        if ($subCategory->image && file_exists(public_path($subCategory->image))) {
            unlink(public_path($subCategory->image));
        }

        $subCategory->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
