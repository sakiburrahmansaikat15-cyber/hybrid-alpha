<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class VendorController extends Controller
{
    // ✅ List vendors with pagination
        public function index(Request $request)
    {
         $keyword = $request->query('keyword', '');
        $limit = (int) $request->query('limit', 10);
       

        $query = Vendor::query();

        // 🔍 Apply search if keyword provided
       if ($keyword) {
    $query->where(function ($q) use ($keyword) {
        $q->where('name', 'like', "%{$keyword}%")
          ->orWhere('shop_name', 'like', "%{$keyword}%");
    });
}

        // 📄 Paginate results
        $serials = $query->latest()->paginate($limit);

        
        return response()->json([
            'message' => 'Vendor fetched successfully',
            'pagination' => [
                'current_page' => $serials->currentPage(),
                'per_page' => $serials->perPage(),
                'total_items' => $serials->total(),
                'total_pages' => $serials->lastPage(),
                'data' => VendorResource::collection($serials),
            ],
        ]);
    }

    // ✅ Store a new vendor
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'      => 'required|string|max:255',
            'shop_name' => 'required|string|max:255',
            'email'     => 'required|email|unique:vendors,email',
            'contact'   => 'required|string|max:20',
            'address'   => 'required|string',
            'status'    => 'required|in:active,inactive',
            'image'     => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            $folder = public_path('vendor');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'vendor/' . $imageName;
        }

        $vendor = Vendor::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Vendor created successfully',
            'data' => new VendorResource($vendor)
        ], 201);
    }

    // ✅ Show a single vendor
    public function show($id)
    {
        $vendor = Vendor::find($id);

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new VendorResource($vendor)
        ], 200);
    }

    // ✅ Update a vendor
    public function update(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);

        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'shop_name' => 'sometimes|string|max:255',
            'email'     => 'sometimes|email|unique:vendors,email,' . $vendor->id,
            'contact'   => 'sometimes|string|max:20',
            'address'   => 'sometimes|string',
            'status'    => 'required|in:active,inactive',
            'image'     => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // Handle image update
        if ($request->hasFile('image')) {
            if ($vendor->image && File::exists(public_path($vendor->image))) {
                File::delete(public_path($vendor->image));
            }

            $folder = public_path('vendor');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'vendor/' . $imageName;
        }

        $vendor->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Vendor updated successfully',
            'data' => new VendorResource($vendor)
        ], 200);
    }

    // ✅ Delete a vendor
    public function destroy($id)
    {
        $vendor = Vendor::find($id);

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found'
            ], 404);
        }

        if ($vendor->image && File::exists(public_path($vendor->image))) {
            File::delete(public_path($vendor->image));
        }

        $vendor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vendor deleted successfully'
        ], 200);
    }
}
