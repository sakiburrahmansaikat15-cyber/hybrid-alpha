<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class BrandController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:brands.view')->only(['index', 'show']);
        $this->middleware('permission:brands.create')->only(['store']);
        $this->middleware('permission:brands.edit')->only(['update']);
        $this->middleware('permission:brands.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Brand::query();

        // 🔍 Apply search if keyword provided
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit, return all results
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Brands fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => BrandResource::collection($data),
                ],
            ]);
        }

        // 📄 Otherwise, paginate results
        $limit = (int) $limit ?: 10;
        $brands = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Brands fetched successfully',
            'pagination' => [
                'current_page' => $brands->currentPage(),
                'per_page' => $brands->perPage(),
                'total_items' => $brands->total(),
                'total_pages' => $brands->lastPage(),
                'data' => BrandResource::collection($brands),
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
            $folder = public_path('brand');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'brand/' . $imageName;
        }

        $brand = Brand::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Brand created successfully',
            'data' => new BrandResource($brand)
        ], 201);
    }


    public function show($id)
    {
        $brand = Brand::find($id);

        if (!$brand) {
            return response()->json([
                'success' => false,
                'message' => 'Brand not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new BrandResource($brand)
        ], 200);
    }


    public function update(Request $request, $id)
    {
        $brand = Brand::find($id);

        if (!$brand) {
            return response()->json([
                'success' => false,
                'message' => 'Brand not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'sometimes|in:active,inactive',
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
            if ($brand->image && File::exists(public_path($brand->image))) {
                File::delete(public_path($brand->image));
            }

            $folder = public_path('brand');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'brand/' . $imageName;
        }

        $brand->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Brand updated successfully',
            'data' => new BrandResource($brand)
        ], 200);
    }


    public function destroy($id)
    {
        $brand = Brand::find($id);

        if (!$brand) {
            return response()->json([
                'success' => false,
                'message' => 'Brand not found'
            ], 404);
        }

        if ($brand->image && File::exists(public_path($brand->image))) {
            File::delete(public_path($brand->image));
        }

        $brand->delete();

        return response()->json([
            'success' => true,
            'message' => 'Brand deleted successfully'
        ], 200);
    }
}
