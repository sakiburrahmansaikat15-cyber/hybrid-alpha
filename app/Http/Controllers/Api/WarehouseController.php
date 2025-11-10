<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class WarehouseController extends Controller
{
    /* =============================================================
       LIST
       ============================================================= */
    public function index(Request $request): JsonResponse
    {
        $query = Warehouse::query();

        if ($q = $request->get('q')) {
            $query->search($q);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->boolean('status'));
        }

        $data = $query->latest()->paginate($request->get('per_page', 15));

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
            'name'    => 'required|string|max:255|unique:warehouses,name',
            'address' => 'required|string',
            'note'    => 'nullable|string',
            'status'  => 'required|in:1,0,true,false', // ONLY true/false
        ]);

        return $this->transaction(function () use ($request) {
            $warehouse = Warehouse::create([
                'name'    => $request->name,
                'address' => $request->address,
                'note'    => $request->note,
                'status'  => $request->boolean('status'), // → true/false
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Warehouse created',
                'data'    => $warehouse,
            ], 201);
        });
    }

    /* =============================================================
       SHOW
       ============================================================= */
    public function show(int $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $warehouse,
        ]);
    }

    /* =============================================================
       UPDATE
       ============================================================= */
    public function update(Request $request, int $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        $request->validate([
            'name'    => ['sometimes', 'string', 'max:255', Rule::unique('warehouses')->ignore($id)],
            'address' => 'sometimes|string',
            'note'    => 'nullable|string',
            'status'  => 'sometimes|in:1,0,true,false', // ONLY true/false
        ]);

        return $this->transaction(function () use ($request, $warehouse) {
            $data = $request->only(['name', 'address', 'note']);

            if ($request->has('status')) {
                $data['status'] = $request->boolean('status'); // → true/false
            }

            $warehouse->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Warehouse updated',
                'data'    => $warehouse,
            ]);
        });
    }

    /* =============================================================
       DESTROY
       ============================================================= */
    public function destroy(int $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        return $this->transaction(function () use ($warehouse) {
            $warehouse->delete();

            return response()->json([
                'success' => true,
                'message' => 'Warehouse deleted',
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
            Log::error('Warehouse error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => 'Operation failed',
                'error'   => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}