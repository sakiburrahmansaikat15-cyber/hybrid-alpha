<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class VendorController extends Controller
{
    // List all vendors
    public function index()
    {
        $vendors = Vendor::latest()->get();
        return VendorResource::collection($vendors);
    }

    // Store a new vendor
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'shop_name' => 'required|string|max:255',
            'email'     => 'required|email|unique:vendors,email',
            'contact'   => 'required|string|max:20',
            'address'   => 'required|string',
            'status'    => 'required|in:active,inactive',
            'image'     => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $folder = public_path('vendor');

            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }

            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'vendor/' . $imageName;
        }

        $vendor = Vendor::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Vendor created successfully',
            'data'    => new VendorResource($vendor)
        ], 201);
    }

    // Show a single vendor
    public function show($id)
    {
        $vendor = Vendor::findOrFail($id);
        return new VendorResource($vendor);
    }

    // Update a vendor
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

            $image = $request->file('image');
            $folder = public_path('vendor');

            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }

            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'vendor/' . $imageName;
        }

        $vendor->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Vendor updated successfully',
            'data'    => new VendorResource($vendor)
        ], 200);
    }

    // Delete a vendor
    public function destroy($id)
    {
        $vendor = Vendor::findOrFail($id);

        // Delete image if exists
        if ($vendor->image && File::exists(public_path($vendor->image))) {
            File::delete(public_path($vendor->image));
        }

        $vendor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vendor deleted successfully'
        ]);
    }
}
