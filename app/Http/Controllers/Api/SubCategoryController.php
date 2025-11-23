<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubCategoryResource;
use App\Models\SubCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;


class SubCategoryController extends Controller
{
     public function index()
    {
        $categories = SubCategory::latest()->get();
        return SubCategoryResource::collection($categories);
    }

    // ✅ Store a new category
     public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'required|in:active,inactive',
            'category_id' => 'nullable'
        ]);

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $folder = public_path('sub_categories');

            // Create folder if not exists
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }

            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'sub_categories/' . $imageName;
        }

        $category = SubCategory::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Sub_Category created successfully',
            'data' => new SubCategoryResource($category)
        ], 201);
    }

    // ✅ Show a single category
    public function show($id)
    {
        $category = SubCategory::findOrFail($id);
        return new SubCategoryResource($category);
    }

    // ✅ Update category
public function update(Request $request, $id)
{
    $category = SubCategory::findOrFail($id);


        if ($request->has('status')) {
        if ($request->status === 'active') $request->merge(['status' => true]);
        if ($request->status === 'inactive') $request->merge(['status' => false]);
        }


    $data = $request->validate([
    'name' => 'nullable|string|max:255',
    'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
    'status' => 'nullable|boolean',
    'category_id' => 'nullable|exists:categories,id'
]);


    if ($request->hasFile('image')) {
        if ($category->image && File::exists(public_path($category->image))) {
            File::delete(public_path($category->image));
        }

        $image = $request->file('image');
        $folder = public_path('sub_categories');
        if (!File::exists($folder)) {
            File::makeDirectory($folder, 0777, true, true);
        }

        $imageName = time() . '_' . $image->getClientOriginalName();
        $image->move($folder, $imageName);
        $data['image'] = 'sub_categories/' . $imageName;
    }


    $category->update($data);
    $category->refresh();

    return response()->json([
        'success' => true,
        'message' => 'Sub_Category updated successfully',
        'data' => new SubCategoryResource($category)
    ], 200);
}

    // ✅ Delete category
    public function destroy($id)
    {
        $category = SubCategory::findOrFail($id);

        // Delete image if exists
        if ($category->image && File::exists(public_path($category->image))) {
            File::delete(public_path($category->image));
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sub_Category deleted successfully'
        ]);
    }
}
