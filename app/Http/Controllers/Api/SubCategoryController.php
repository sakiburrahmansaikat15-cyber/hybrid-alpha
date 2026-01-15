<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubCategoryResource;
use App\Models\SubCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class SubCategoryController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = SubCategory::with('category');

        // 🔍 Apply search filter if keyword provided
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit, return all results
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'SubCategories fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => SubCategoryResource::collection($data),
                ],
            ]);
        }

        // 📄 Otherwise, paginate results
        $limit = (int) $limit ?: 10;
        $subCategories = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'SubCategories fetched successfully',
            'pagination' => [
                'current_page' => $subCategories->currentPage(),
                'per_page' => $subCategories->perPage(),
                'total_items' => $subCategories->total(),
                'total_pages' => $subCategories->lastPage(),
                'data' => SubCategoryResource::collection($subCategories),
            ],
        ]);
    }


    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'required|in:active,inactive',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // ✅ Handle image upload
        if ($request->hasFile('image')) {
            $folder = public_path('sub_categories');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'sub_categories/' . $imageName;
        }

        if (isset($data['status'])) {
            $data['status'] = $data['status'];
        }

        $category = SubCategory::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Sub-category created successfully',
            'data' => new SubCategoryResource($category),
        ], 201);
    }

    // ✅ Show a single sub-category
    public function show($id)
    {
        $category = SubCategory::with(['category'])->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Sub-category not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new SubCategoryResource($category),
        ], 200);
    }

    // ✅ Update a sub-category
    public function update(Request $request, $id)
    {
        $category = SubCategory::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Sub-category not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'sometimes|in:active,inactive',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // ✅ Handle image update
        if ($request->hasFile('image')) {
            if ($category->image && File::exists(public_path($category->image))) {
                File::delete(public_path($category->image));
            }

            $folder = public_path('sub_categories');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'sub_categories/' . $imageName;
        }

        if (isset($data['status'])) {
            $data['status'] = $data['status'];
        }

        $category->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Sub-category updated successfully',
            'data' => new SubCategoryResource($category),
        ], 200);
    }

    // ✅ Delete a sub-category
    public function destroy($id)
    {
        $category = SubCategory::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Sub-category not found',
            ], 404);
        }

        if ($category->image && File::exists(public_path($category->image))) {
            File::delete(public_path($category->image));
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sub-category deleted successfully',
        ], 200);
    }

}
