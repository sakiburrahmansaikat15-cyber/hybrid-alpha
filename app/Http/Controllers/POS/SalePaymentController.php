<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\SalePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SalePaymentController extends Controller
{
    /**
     * 📋 Display a listing of the sale payments with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = SalePayment::with(['sale', 'paymentMethod']);

        // 🔍 Apply search filter
        if ($keyword) {
            $query->where('reference_no', 'like', "%{$keyword}%")
                  ->orWhereHas('sale', function ($q) use ($keyword) {
                      $q->where('invoice_no', 'like', "%{$keyword}%");
                  })
                  ->orWhereHas('paymentMethod', function ($q) use ($keyword) {
                      $q->where('name', 'like', "%{$keyword}%");
                  });
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Sale payments fetched successfully',
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
        $payments = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Sale payments fetched successfully',
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'per_page' => $payments->perPage(),
                'total_items' => $payments->total(),
                'total_pages' => $payments->lastPage(),
                'data' => $payments->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created sale payment
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sale_id'           => 'required|exists:sales,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'amount'            => 'required|numeric|min:0',
            'reference_no'      => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payment = SalePayment::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sale payment created successfully',
            'data' => $payment->load(['sale', 'paymentMethod']),
        ], 201);
    }

    /**
     * 👁️ Show details of a specific sale payment
     */
    public function show($id)
    {
        $payment = SalePayment::with(['sale', 'paymentMethod'])->find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Sale payment not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $payment,
        ], 200);
    }

    /**
     * ✏️ Update an existing sale payment
     */
    public function update(Request $request, $id)
    {
        $payment = SalePayment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Sale payment not found',
            ], 404);
        }

        $data = $request->validate([
            'sale_id'           => 'sometimes|exists:sales,id',
            'payment_method_id' => 'sometimes|exists:payment_methods,id',
            'amount'            => 'sometimes|numeric|min:0',
            'reference_no'      => 'nullable|string|max:255',
        ]);

        $payment->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Sale payment updated successfully',
            'data' => $payment->load(['sale', 'paymentMethod']),
        ], 200);
    }

    /**
     * ❌ Delete a sale payment
     */
    public function destroy($id)
    {
        $payment = SalePayment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Sale payment not found',
            ], 404);
        }

        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sale payment deleted successfully',
        ], 200);
    }
}
