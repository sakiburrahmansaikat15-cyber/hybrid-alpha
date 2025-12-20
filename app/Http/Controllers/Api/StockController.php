<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StocksResource;
use App\Models\Stocks;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StockController extends Controller
{
    // ✅ List all stocks with pagination
     public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = (int) $request->query('limit', 10);
        $page = (int) $request->query('page', 1);

        $query = Stocks::with('product','vendor','warehouse');

        // 🔍 Apply search if keyword provided
          if ($keyword) {
        $query->where('sku', 'like', "%{$keyword}%")
            ->orWhereHas('product', fn($q) => $q->where('name', 'like', "%{$keyword}%"))
            ->orWhereHas('vendor', fn($q) => $q->where('name', 'like', "%{$keyword}%"));
    }

        // 📄 Paginate and order
        $stocks = $query->latest()->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Stocks fetched successfully',
            'current_page' => $stocks->currentPage(),
            'per_page' => $stocks->perPage(),
            'total_items' => $stocks->total(),
            'total_pages' => $stocks->lastPage(),
            'data' => StocksResource::collection($stocks->items()),
        ]);
    }


    // ✅ Store a new stock
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'nullable|exists:prooducts,id',
            'vendor_id' => 'nullable|exists:vendors,id',
            "warehouse_id" =>'nullable|exists:warehouses,id',
            'quantity' => 'required|integer|min:0',
            'buying_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric',
            'stock_date' => 'nullable|date',
            'comission' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,inactive',
            'sku' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        $stock = Stocks::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Stock created successfully',
            'data' => new StocksResource($stock)
        ], 201);
    }

    // ✅ Show a single stock
    public function show($id)
    {
        $stock = Stocks::find($id);

        if (!$stock) {
            return response()->json([
                'success' => false,
                'message' => 'Stock not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new StocksResource($stock)
        ], 200);
    }

    // ✅ Update a stock
    public function update(Request $request, $id)
    {
        $stock = Stocks::find($id);

        if (!$stock) {
            return response()->json([
                'success' => false,
                'message' => 'Stock not found'
            ], 404);
        }

        $data = $request->validate([
            'product_id' => 'sometimes|exists:products,id',
            'vendor_id' => 'sometimes|exists:vendors,id',
             "warehouse_id" =>'nullable|exists:warehouses,id',
            'quantity' => 'sometimes|integer|min:0',
            'buying_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'stock_date' => 'nullable|date',
            'comission' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
            'sku' => 'nullable|string|max:255',
        ]);

        $stock->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Stock updated successfully',
            'data' => new StocksResource($stock)
        ], 200);
    }

    // ✅ Delete a stock
    public function destroy($id)
    {
        $stock = Stocks::find($id);

        if (!$stock) {
            return response()->json([
                'success' => false,
                'message' => 'Stock not found'
            ], 404);
        }

        $stock->delete();

        return response()->json([
            'success' => true,
            'message' => 'Stock deleted successfully'
        ], 200);
    }
}
