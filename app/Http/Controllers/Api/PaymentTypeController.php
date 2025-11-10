<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentTypeController extends Controller
{
    // Folder inside /public where images will be stored
    protected $imageDir = 'payment-types';

    /**
     * List all payment types with pagination, search, and filters
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->get('per_page', 15);
        $q = $request->get('q');
        $type = $request->get('type');
        $status = $request->get('status');
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = strtolower($request->get('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query = PaymentType::query();

        // 🔍 Global search
        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('type', 'like', "%{$q}%")
                    ->orWhere('account_number', 'like', "%{$q}%")
                    ->orWhere('notes', 'like', "%{$q}%");
            });
        }

        // 🔍 Filters
        if ($type) {
            $query->where('type', $type);
        }

        if (!is_null($status)) {
            $query->where('status', (int)$status);
        }

        // 🧭 Sorting
        $allowedSorts = ['id', 'name', 'type', 'created_at', 'updated_at'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }

        $paginator = $query->orderBy($sortBy, $sortDir)->paginate($perPage);

        return response()->json($paginator, 200);
    }

    /**
     * Store a new payment type and save uploaded images in /public/payment-types
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'nullable|boolean',
            'images.*' => 'nullable|image|max:2048'
        ]);

        DB::beginTransaction();

        try {
            $images = $this->saveImagesToPublic($request->file('images', []));
            $validated['images'] = $images;

            $paymentType = PaymentType::create($validated);

            DB::commit();
            return response()->json(['message' => 'Payment type created successfully', 'data' => $paymentType], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating payment type', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Show a specific payment type
     */
    public function show($id)
    {
        $paymentType = PaymentType::findOrFail($id);
        return response()->json($paymentType, 200);
    }

    /**
     * Update an existing payment type and its images
     */
    public function update(Request $request, $id)
    {
        $paymentType = PaymentType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'nullable|boolean',
            'images.*' => 'nullable|image|max:2048',
            'remove_images' => 'array'
        ]);

        DB::beginTransaction();

        try {
            // 🗑️ Remove selected images
            if (!empty($validated['remove_images'])) {
                $this->removeImagesFromModel($paymentType, $validated['remove_images']);
            }

            // 📸 Add new images
            $newImages = $this->saveImagesToPublic($request->file('images', []));
            $currentImages = $paymentType->images ?? [];
            $mergedImages = array_values(array_filter(array_merge($currentImages, $newImages)));

            $validated['images'] = $mergedImages;

            $paymentType->update($validated);

            DB::commit();
            return response()->json(['message' => 'Payment type updated successfully', 'data' => $paymentType], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating payment type', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a payment type and all its images
     */
    public function destroy($id)
    {
        $paymentType = PaymentType::findOrFail($id);

        DB::beginTransaction();

        try {
            $this->deleteAllImages($paymentType);
            $paymentType->delete();

            DB::commit();
            return response()->json(['message' => 'Payment type deleted successfully'], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error deleting payment type', 'error' => $e->getMessage()], 500);
        }
    }

    /* =====================================================
       🔧 Helper methods for saving/removing images in /public
       ===================================================== */

    /**
     * Save uploaded images to /public/payment-types and return filenames
     */
    protected function saveImagesToPublic(array $files): array
    {
        if (empty($files)) {
            return [];
        }

        $saved = [];
        $dir = public_path($this->imageDir);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        foreach ($files as $file) {
            if (!$file || !$file->isValid()) continue;

            $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move($dir, $filename);

            $saved[] = $filename;
        }

        return $saved;
    }

    /**
     * Remove selected images from model and delete physical files
     */
    protected function removeImagesFromModel(PaymentType $model, array $removeList): void
    {
        $current = $model->images ?? [];
        $remaining = array_values(array_diff($current, $removeList));

        foreach ($removeList as $file) {
            $path = public_path("{$this->imageDir}/{$file}");
            if (is_file($path)) {
                @unlink($path);
            }
        }

        $model->images = $remaining;
        $model->save();
    }

    /**
     * Delete all images for a given payment type
     */
    protected function deleteAllImages(PaymentType $model): void
    {
        $current = $model->images ?? [];
        foreach ($current as $file) {
            $path = public_path("{$this->imageDir}/{$file}");
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }
}
