<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubItemsResource;
use App\Models\SubItems;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class SubItemController extends Controller
{
    // ✅ List all sub-items with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 10);
        $page = (int) $request->query('page', 1);

        $subItems = SubItems::latest()->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Sub-items fetched successfully',
            'page' => $subItems->currentPage(),
            'perPage' => $subItems->perPage(),
            'totalItems' => $subItems->total(),
            'totalPages' => $subItems->lastPage(),
            'data' => SubItemsResource::collection($subItems->items()),
        ]);
    }

    // ✅ Store a new sub-item
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'required|in:active,inactive',
            'sub_category_id' => 'nullable|exists:sub_categories,id',
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
            $folder = public_path('sub_item');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'sub_item/' . $imageName;
        }

        $subItem = SubItems::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Sub-item created successfully',
            'data' => new SubItemsResource($subItem)
        ], 201);
    }

    // ✅ Show a single sub-item
    public function show($id)
    {
        $subItem = SubItems::find($id);

        if (!$subItem) {
            return response()->json([
                'success' => false,
                'message' => 'Sub-item not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new SubItemsResource($subItem),
        ], 200);
    }

    // ✅ Update a sub-item
    public function update(Request $request, $id)
    {
        $subItem = SubItems::find($id);

        if (!$subItem) {
            return response()->json([
                'success' => false,
                'message' => 'Sub-item not found',
            ], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'sometimes|in:active,inactive',
            'sub_category_id' => 'nullable|exists:sub_categories,id',
        ]);

        if ($request->hasFile('image')) {
            if ($subItem->image && File::exists(public_path($subItem->image))) {
                File::delete(public_path($subItem->image));
            }

            $folder = public_path('sub_item');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'sub_item/' . $imageName;
        }

        $subItem->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Sub-item updated successfully',
            'data' => new SubItemsResource($subItem)
        ], 200);
    }

    // ✅ Delete a sub-item
    public function destroy($id)
    {
        $subItem = SubItems::find($id);

        if (!$subItem) {
            return response()->json([
                'success' => false,
                'message' => 'Sub-item not found',
            ], 404);
        }

        if ($subItem->image && File::exists(public_path($subItem->image))) {
            File::delete(public_path($subItem->image));
        }

        $subItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sub-item deleted successfully',
        ], 200);
    }

    // ✅ Search sub-items
    public function search(Request $request)
    {
        $keyword = $request->query('keyword', '');

        $subItems = SubItems::where('name', 'like', "%{$keyword}%")
            ->orWhereHas('subCategory', function ($query) use ($keyword) {
                $query->where('name', 'like', "%{$keyword}%");
            })
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Search results fetched successfully',
            'data' => SubItemsResource::collection($subItems),
        ]);
    }
}
