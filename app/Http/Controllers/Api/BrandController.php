<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class BrandController extends Controller
{
    /** Display a listing of brands */
    public function index(): JsonResponse
    {
        try {
            $brands = Brand::select('id', 'name', 'image', 'status', 'created_at')
                ->latest()
                ->get();

            // Transform image paths to full URLs
            $brands->transform(function ($brand) {
                $brand->image_urls = $this->getImageUrls($brand->image);
                return $brand;
            });

            return response()->json([
                'success' => true,
                'data' => $brands
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching brands: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch brands'
            ], 500);
        }
    }

    /** Store a new brand */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255|unique:brands,name',
                'status' => 'required|boolean',
                'image' => 'sometimes|array',
                'image.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120'
            ]);

            $imagePaths = [];
            if ($request->hasFile('image')) {
                $imagePaths = $this->uploadImages($request->file('image'));
            }

            $brand = Brand::create([
                'name' => $request->name,
                'image' => $imagePaths,
                'status' => $request->boolean('status'),
            ]);

            $brand->image_urls = $this->getImageUrls($brand->image);

            return response()->json([
                'success' => true,
                'message' => 'Brand created successfully',
                'data' => $brand
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating brand: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create brand',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /** Display the specified brand */
    public function show(Brand $brand): JsonResponse
    {
        try {
            $brand->image_urls = $this->getImageUrls($brand->image);

            return response()->json([
                'success' => true,
                'data' => $brand
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching brand: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch brand'
            ], 500);
        }
    }

    /** Update the specified brand */
    public function update(Request $request, Brand $brand): JsonResponse
    {
        try {
            Log::info('Update request received', [
                'brand_id' => $brand->id,
                'request_data' => $request->all(),
                'has_files' => $request->hasFile('image')
            ]);

            $request->validate([
                'name' => 'sometimes|string|max:255|unique:brands,name,' . $brand->id,
                'status' => 'sometimes|boolean',
                'image' => 'sometimes|array',
                'image.*' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:5120'
            ]);

            $data = [
                'name' => $request->name ?? $brand->name,
                'status' => $request->has('status') ? $request->boolean('status') : $brand->status,
            ];

            // Handle image updates
            if ($request->hasFile('image')) {
                Log::info('New images provided, updating images');
                // Delete old images
                $this->deleteImages($brand->image);
                // Upload new images
                $data['image'] = $this->uploadImages($request->file('image'));
            } else {
                Log::info('No new images, keeping existing images');
                $data['image'] = $brand->image;
            }

            Log::info('Updating brand with data:', $data);
            $brand->update($data);

            $brand->image_urls = $this->getImageUrls($brand->image);

            return response()->json([
                'success' => true,
                'message' => 'Brand updated successfully',
                'data' => $brand
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating brand: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update brand',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /** Remove the specified brand */
    public function destroy(Brand $brand): JsonResponse
    {
        try {
            // Delete images from public/brand
            $this->deleteImages($brand->image);
            $brand->delete();

            return response()->json([
                'success' => true,
                'message' => 'Brand deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting brand: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete brand'
            ], 500);
        }
    }

    /** Helper: Upload multiple images to public/brand */
    private function uploadImages(array $files): array
    {
        $paths = [];

        foreach ($files as $file) {
            if ($file->isValid()) {
                // Store directly in public/brand
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('brand'), $filename);
                $paths[] = 'brand/' . $filename; // relative path for DB
                Log::info('Image uploaded: ' . 'brand/' . $filename);
            }
        }

        return $paths;
    }

    /** Helper: Delete images from public/brand */
    private function deleteImages(array $images): void
    {
        foreach ($images as $path) {
            $fullPath = public_path($path);
            if (file_exists($fullPath)) {
                unlink($fullPath);
                Log::info('Image deleted: ' . $path);
            }
        }
    }

    /** Helper: Get full URLs for images */
    private function getImageUrls(array $images): array
    {
        return array_map(function ($path) {
            return asset($path);
        }, $images);
    }
}
