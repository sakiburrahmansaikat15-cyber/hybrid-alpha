<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\SaleDiscount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SaleDiscountController extends Controller
{
    /**
     * 📋 Display a listing of the sale discounts with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = SaleDiscount::with('sale');

        // 🔍 Apply search filter (by sale_id or type)
        if ($keyword) {
            $query->where('type', 'like', "%{$keyword}%")
                  ->orWhereHas('sale', function ($q) use ($keyword) {
                      $q->where('invoice_no', 'like', "%{$keyword}%");
                  });
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Sale discounts fetched successfully',
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
        $discounts = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Sale discounts fetched successfully',
            'pagination' => [
                'current_page' => $discounts->currentPage(),
                'per_page' => $discounts->perPage(),
                'total_items' => $discounts->total(),
                'total_pages' => $discounts->lastPage(),
                'data' => $discounts->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created sale discount
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sale_id' => 'required|exists:sales,id',
            'type'    => 'required|in:percentage,fixed',
            'value'   => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $discount = SaleDiscount::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sale discount created successfully',
            'data'    => $discount->load('sale'),
        ], 201);
    }

    /**
     * 👁️ Show details of a specific sale discount
     */
    public function show($id)
    {
        $discount = SaleDiscount::with('sale')->find($id);

        if (!$discount) {
            return response()->json([
                'success' => false,
                'message' => 'Sale discount not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $discount,
        ], 200);
    }

    /**
     * ✏️ Update an existing sale discount
     */
    public function update(Request $request, $id)
    {
        $discount = SaleDiscount::find($id);

        if (!$discount) {
            return response()->json([
                'success' => false,
                'message' => 'Sale discount not found',
            ], 404);
        }

        $data = $request->validate([
            'sale_id' => 'sometimes|exists:sales,id',
            'type'    => 'sometimes|in:percentage,fixed',
            'value'   => 'sometimes|numeric|min:0',
        ]);

        $discount->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Sale discount updated successfully',
            'data' => $discount->load('sale'),
        ], 200);
    }

    /**
     * ❌ Delete a sale discount
     */
    public function destroy($id)
    {
        $discount = SaleDiscount::find($id);

        if (!$discount) {
            return response()->json([
                'success' => false,
                'message' => 'Sale discount not found',
            ], 404);
        }

        $discount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sale discount deleted successfully',
        ], 200);
    }
}
