<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class VendorController extends Controller
{
    /**
     * Display a listing of vendors.
     */
    public function index()
    {
        $vendors = Vendor::latest()->get();

        return VendorResource::collection($vendors);
    }

    /**
     * Store a newly created vendor.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'shop_name' => 'required|string|max:255',
            'email'     => 'required|email|unique:vendors,email',
            'contact'   => 'required|string|max:20',
            'address'   => 'required|string',
            'status'    => 'required|boolean', // true = active, false = inactive
            'image'     => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048', // max 2MB
        ]);

        // Handle image upload (clean & safe)
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('vendors', 'public');
            $validated['image'] = $path;
        }

        $vendor = Vendor::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Vendor created successfully.',
            'data'    => new VendorResource($vendor)
        ], 201);
    }

    /**
     * Display the specified vendor.
     */
    public function show(Vendor $vendor)
    {
        return new VendorResource($vendor);
    }

    /**
     * Update the specified vendor.
     */
    public function update(Request $request, Vendor $vendor)
    {
        $validated = $request->validate([
            'name'      => 'sometimes|required|string|max:255',
            'shop_name' => 'sometimes|required|string|max:255',
            'email'     => 'sometimes|required|email|unique:vendors,email,' . $vendor->id,
            'contact'   => 'sometimes|required|string|max:20',
            'address'   => 'sometimes|required|string',
            'status'    => 'sometimes|required|boolean',
            'image'     => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // Handle image replacement
        if ($request->hasFile('image')) {
            // Delete old image
            if ($vendor->image) {
                Storage::disk('public')->delete($vendor->image);
            }
            $path = $request->file('image')->store('vendors', 'public');
            $validated['image'] = $path;
        }

        $vendor->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Vendor updated successfully.',
            'data'    => new VendorResource($vendor)
        ]);
    }

    /**
     * Remove the specified vendor.
     */
    public function destroy(Vendor $vendor)
    {
        // Delete image from storage
        if ($vendor->image) {
            Storage::disk('public')->delete($vendor->image);
        }

        $vendor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vendor deleted successfully.'
        ]);
    }
}
