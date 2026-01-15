<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentMethodController extends Controller
{
    /**
     * 📋 Display a listing of the payment methods with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = PaymentMethod::query();

        // 🔍 Apply search filter
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // 🏷️ Apply status filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Payment methods fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => $data,
                ],
            ]);
        }

        // 📄 Paginate results
        $limit = (int) $limit ?: 10;
        $methods = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Payment methods fetched successfully',
            'pagination' => [
                'current_page' => $methods->currentPage(),
                'per_page' => $methods->perPage(),
                'total_items' => $methods->total(),
                'total_pages' => $methods->lastPage(),
                'data' => $methods->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created payment method
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:payment_methods,name',
            'type' => 'required|in:cash,card,voucher,wallet',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $method = PaymentMethod::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Payment method created successfully',
            'data' => $method,
        ], 201);
    }

    /**
     * 👁️ Show details of a specific payment method
     */
    public function show($id)
    {
        $method = PaymentMethod::find($id);

        if (!$method) {
            return response()->json([
                'success' => false,
                'message' => 'Payment method not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $method,
        ], 200);
    }

    /**
     * ✏️ Update an existing payment method
     */
    public function update(Request $request, $id)
    {
        $method = PaymentMethod::find($id);

        if (!$method) {
            return response()->json([
                'success' => false,
                'message' => 'Payment method not found',
            ], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255|unique:payment_methods,name,' . $method->id,
            'type' => 'sometimes|in:cash,card,voucher,wallet',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $method->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Payment method updated successfully',
            'data' => $method,
        ], 200);
    }

    /**
     * ❌ Delete a payment method
     */
    public function destroy($id)
    {
        $method = PaymentMethod::find($id);

        if (!$method) {
            return response()->json([
                'success' => false,
                'message' => 'Payment method not found',
            ], 404);
        }

        $method->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment method deleted successfully',
        ], 200);
    }
}
