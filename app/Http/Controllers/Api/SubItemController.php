<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubItemsResource;
use App\Models\SubItems;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;


class SubItemController extends Controller
{
 public function index()
    {
        $categories = SubItems::latest()->get();
        return SubItemsResource::collection($categories);
    }

    // ✅ Store a new category
     public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
             'status' => 'required|in:active,inactive',
            'sub_category_id' => 'nullable'
        ]);

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $folder = public_path('sub_item');

            // Create folder if not exists
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }

            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'sub_item/' . $imageName;
        }

        $category = SubItems::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Sub_Item created successfully',
            'data' => new SubItemsResource($category)
        ], 201);
    }

    // ✅ Show a single category
    public function show($id)
    {
        $category = SubItems::findOrFail($id);
        return new SubItemsResource($category);
    }

    // ✅ Update category
public function update(Request $request, $id)
{
    $category = SubItems::findOrFail($id);


        if ($request->has('status')) {
        if ($request->status === 'active') $request->merge(['status' => true]);
        if ($request->status === 'inactive') $request->merge(['status' => false]);
        }

    $data = $request->validate([
    'name' => 'nullable|string|max:255',
    'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
    'status' => 'nullable|boolean',
    'sub_category_id' => 'nullable|exists:categories,id'
]);


    if ($request->hasFile('image')) {
        if ($category->image && File::exists(public_path($category->image))) {
            File::delete(public_path($category->image));
        }

        $image = $request->file('image');
        $folder = public_path('sub_item');
        if (!File::exists($folder)) {
            File::makeDirectory($folder, 0777, true, true);
        }

        $imageName = time() . '_' . $image->getClientOriginalName();
        $image->move($folder, $imageName);
        $data['image'] = 'sub_item/' . $imageName;
    }


    $category->update($data);

    return response()->json([
        'success' => true,
        'message' => 'Sub_Item updated successfully',
        'data' => new SubItemsResource($category)
    ], 200);
}

    // ✅ Delete category
    public function destroy($id)
    {
        $category = SubItems::findOrFail($id);

        // Delete image if exists
        if ($category->image && File::exists(public_path($category->image))) {
            File::delete(public_path($category->image));
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sub_Item deleted successfully'
        ]);
    }
}
