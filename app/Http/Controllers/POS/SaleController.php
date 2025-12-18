<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SaleController extends Controller
{
    /**
     * 📋 Display a listing of the sales with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

      
        $query = Sale::with(['terminal', 'customer']);

    
        if ($keyword) {
            $query->where('invoice_no', 'like', "%{$keyword}%")
                  ->orWhereHas('customer', function ($q) use ($keyword) {
                      $q->where('name', 'like', "%{$keyword}%");
                  });
        }

        // ⚙️ If no limit provided, return all results
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Sales fetched successfully',
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
        $sales = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Sales fetched successfully',
            'pagination' => [
                'current_page' => $sales->currentPage(),
                'per_page' => $sales->perPage(),
                'total_items' => $sales->total(),
                'total_pages' => $sales->lastPage(),
                'data' => $sales->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created sale
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'terminal_id'  => 'required|exists:pos_terminals,id',
            'customer_id'  => 'nullable|exists:pos_customers,id',
            'invoice_no'   => 'required|string|max:255|unique:sales,invoice_no',
            'total_amount' => 'required|numeric|min:0',
            'status'       => 'required|in:pending,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $sale = Sale::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sale created successfully',
            'data' => $sale->load(['terminal', 'customer']),
        ], 201);
    }

    /**
     * 👁️ Show details of a specific sale
     */
    public function show($id)
    {
        $sale = Sale::with(['terminal', 'customer', 'payments', 'taxes', 'discounts', 'items'])
                    ->find($id);

        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Sale not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $sale,
        ], 200);
    }

    /**
     * ✏️ Update an existing sale
     */
    public function update(Request $request, $id)
    {
        $sale = Sale::find($id);

        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Sale not found',
            ], 404);
        }

        $data = $request->validate([
            'terminal_id'  => 'sometimes|exists:pos_terminals,id',
            'customer_id'  => 'nullable|exists:pos_customers,id',
            'invoice_no'   => 'sometimes|string|max:255|unique:sales,invoice_no,' . $sale->id,
            'total_amount' => 'sometimes|numeric|min:0',
            'status'       => 'sometimes|in:pending,completed,cancelled',
        ]);

        $sale->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Sale updated successfully',
            'data' => $sale->load(['terminal', 'customer']),
        ], 200);
    }

    /**
     * ❌ Delete a sale
     */
    public function destroy($id)
    {
        $sale = Sale::find($id);

        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Sale not found',
            ], 404);
        }

        $sale->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sale deleted successfully',
        ], 200);
    }
}
