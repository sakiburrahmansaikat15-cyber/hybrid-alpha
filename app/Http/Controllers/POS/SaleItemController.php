<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SaleItemController extends Controller
{
    /**
     * 📋 Display a listing of the sale items with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = SaleItem::with(['sale', 'product']);

        // 🔍 Apply search filter
        if ($keyword) {
            $query->whereHas('sale', function ($q) use ($keyword) {
                $q->where('invoice_no', 'like', "%{$keyword}%");
            })->orWhereHas('product', function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%");
            });
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Sale items fetched successfully',
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
        $items = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Sale items fetched successfully',
            'pagination' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total_items' => $items->total(),
                'total_pages' => $items->lastPage(),
                'data' => $items->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created sale item
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sale_id' => 'required|exists:sales,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $item = SaleItem::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sale item created successfully',
            'data' => $item->load(['sale', 'product']),
        ], 201);
    }

    /**
     * 👁️ Show details of a specific sale item
     */
    public function show($id)
    {
        $item = SaleItem::with(['sale', 'product'])->find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Sale item not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $item,
        ], 200);
    }

    /**
     * ✏️ Update an existing sale item
     */
    public function update(Request $request, $id)
    {
        $item = SaleItem::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Sale item not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'sale_id' => 'sometimes|exists:sales,id',
            'product_id' => 'sometimes|exists:products,id',
            'quantity' => 'sometimes|numeric|min:0',
            'price' => 'sometimes|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0',
            'tax' => 'sometimes|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $item->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sale item updated successfully',
            'data' => $item->load(['sale', 'product']),
        ], 200);
    }

    /**
     * ❌ Delete a sale item
     */
    public function destroy($id)
    {
        $item = SaleItem::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Sale item not found',
            ], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sale item deleted successfully',
        ], 200);
    }
}
