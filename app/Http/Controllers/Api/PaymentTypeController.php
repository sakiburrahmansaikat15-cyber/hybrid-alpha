<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class PaymentTypeController extends Controller
{
    protected const DISK = 'public';
    protected const UPLOAD_DIR = 'payment-type';

    /* =============================================================
       LIST
       ============================================================= */
    public function index(Request $request): JsonResponse
    {
        $query = PaymentType::query();

        // Search
        if ($q = $request->get('q')) {
            $query->search($q);
        }

        // Status filter (strict true/false)
        if ($request->filled('status')) {
            $query->where('status', $request->boolean('status'));
        }

        // Pagination + append image_urls
        $data = $query->latest()->paginate($request->get('per_page', 15));
        $data->getCollection()->transform(fn($item) => $item->append('image_urls'));

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /* =============================================================
       STORE
       ============================================================= */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'           => 'required|string|max:255|unique:payment_types,name',
            'type'           => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'notes'          => 'nullable|string',
            'status'         => 'required|in:1,0,true,false', // STRICT
            'images'         => 'sometimes|array|max:5',
            'images.*'       => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        return $this->transaction(function () use ($request) {
            $paths = $this->storeImages($request->file('images'));

            $payment = PaymentType::create([
                'name'           => $request->name,
                'type'           => $request->type,
                'account_number' => $request->account_number,
                'notes'          => $request->notes,
                'status'         => $request->boolean('status'),
                'images'         => $paths,
            ]);

            Log::info('PaymentType created', ['id' => $payment->id]);

            return response()->json([
                'success' => true,
                'message' => 'Payment type created',
                'data'    => $payment->append('image_urls'),
            ], 201);
        });
    }

    /* =============================================================
       SHOW
       ============================================================= */
    public function show(PaymentType $payment): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $payment->append('image_urls'),
        ]);
    }

    /* =============================================================
       UPDATE
       ============================================================= */
    public function update(Request $request, PaymentType $payment): JsonResponse
    {
        $request->validate([
            'name'           => ['sometimes', 'string', 'max:255', Rule::unique('payment_types')->ignore($payment->id)],
            'type'           => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'notes'          => 'nullable|string',
            'status'         => 'sometimes|in:1,0,true,false', // STRICT
            'images'         => 'sometimes|array|max:5',
            'images.*'       => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        return $this->transaction(function () use ($request, $payment) {
            $data = $request->only(['name', 'type', 'account_number', 'notes']);

            if ($request->has('status')) {
                $data['status'] = $request->boolean('status');
            }

            if ($request->hasFile('images')) {
                $this->deleteImages($payment->images);
                $data['images'] = $this->storeImages($request->file('images'));
            }

            $payment->update($data);

            Log::info('PaymentType updated', ['id' => $payment->id]);

            return response()->json([
                'success' => true,
                'message' => 'Payment type updated',
                'data'    => $payment->append('image_urls'),
            ]);
        });
    }

    /* =============================================================
       DESTROY
       ============================================================= */
    public function destroy(PaymentType $payment): JsonResponse
    {
        return $this->transaction(function () use ($payment) {
            $this->deleteImages($payment->images);
            $payment->delete();

            Log::info('PaymentType deleted', ['id' => $payment->id]);

            return response()->json([
                'success' => true,
                'message' => 'Payment type deleted',
            ]);
        });
    }

    /* =============================================================
       HELPERS
       ============================================================= */

    private function transaction(callable $callback): JsonResponse
    {
        try {
            DB::beginTransaction();
            $response = $callback();
            DB::commit();
            return $response;
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('PaymentType error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Operation failed',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function storeImages(?array $files): array
    {
        if (!$files) return [];

        $paths = [];
        foreach ($files as $file) {
            if ($file->isValid()) {
                $name = time() . '_' . uniqid() . '.' . $file->guessExtension();
                $path = $file->storeAs(self::UPLOAD_DIR, $name, self::DISK);
                $paths[] = $path;
                Log::info("Image uploaded: $path");
            }
        }
        return $paths;
    }

    private function deleteImages(?array $images): void
    {
        if (!$images) return;

        foreach ($images as $path) {
            if (Storage::disk(self::DISK)->exists($path)) {
                Storage::disk(self::DISK)->delete($path);
                Log::info("Image deleted: $path");
            }
        }
    }
}