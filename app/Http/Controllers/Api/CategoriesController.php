<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoriesResource;
use App\Models\Categories;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;


class CategoriesController extends Controller
{

 public function index(Request $request)
{
    $keyword = $request->query('keyword', '');
    $limit = $request->query('limit');

    $query = Categories::query();


    if ($keyword) {
        $query->where('name', 'like', "%{$keyword}%");
    }

    
    if (!$limit) {
        $data = $query->latest()->get();

        return response()->json([
            'message' => 'Categories fetched successfully',
            'pagination' => [
                'current_page' => 1,
                'per_page' => $data->count(),
                'total_items' => $data->count(),
                'total_pages' => 1,
                'data' => CategoriesResource::collection($data),
            ],
        ]);
    }


    $limit = (int) $limit ?: 10;

    $serials = $query->latest()->paginate($limit);

    return response()->json([
        'message' => 'Categories fetched successfully',
        'pagination' => [
            'current_page' => $serials->currentPage(),
            'per_page' => $serials->perPage(),
            'total_items' => $serials->total(),
            'total_pages' => $serials->lastPage(),
            'data' => CategoriesResource::collection($serials),
        ],
    ]);
}


    public function store(Request $request)
    {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
                'status' => 'required|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            if ($request->hasFile('image')) {
                $folder = public_path('categories');
                if (!File::exists($folder)) {
                    File::makeDirectory($folder, 0777, true);
                }

                $image = $request->file('image');
                $imageName = time() . '_' . $image->getClientOriginalName();
                $image->move($folder, $imageName);
                $data['image'] = 'categories/' . $imageName;
            }

            $data['status'] = $data['status'] === 'active';

            $category = Categories::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Category created successfully',
                'data' => new CategoriesResource($category)
            ], 201);
    }


    public function show($id)
    {
            $category = Categories::find($id);

            if (!$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'Category not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => new CategoriesResource($category)
            ], 200);
    }


    public function update(Request $request, $id)
    {
        $category = Categories::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
           'status' => 'sometimes|in:active,inactive',
        ]);

        if ($request->hasFile('image')) {
            if ($category->image && File::exists(public_path($category->image))) {
                File::delete(public_path($category->image));
            }

            $folder = public_path('categories');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
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


    public function destroy($id)
    {
            $category = Categories::find($id);

            if (!$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'Category not found'
                ], 404);
            }

            if ($category->image && File::exists(public_path($category->image))) {
                File::delete(public_path($category->image));
            }

            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully'
            ], 200);
    }
}
