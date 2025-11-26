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
        $limit = (int) $request->query('limit', 10);
        $page = (int) $request->query('page', 1);

        $stocks = Stocks::latest()->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Stocks fetched successfully',
            'page' => $stocks->currentPage(),
            'perPage' => $stocks->perPage(),
            'totalItems' => $stocks->total(),
            'totalPages' => $stocks->lastPage(),
            'data' => StocksResource::collection($stocks->items()),
        ]);
    }

    // ✅ Store a new stock
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:prooducts,id',
            'vendor_id' => 'required|exists:vendors,id',
            'quantity' => 'required|integer|min:0',
            'buying_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
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

    // ✅ Search stocks
    public function search(Request $request)
    {
        $keyword = $request->query('keyword', '');

        $stocks = Stocks::where('sku', 'like', "%{$keyword}%")
            ->orWhereHas('product', function ($query) use ($keyword) {
                $query->where('name', 'like', "%{$keyword}%");
            })
            ->orWhereHas('vendor', function ($query) use ($keyword) {
                $query->where('name', 'like', "%{$keyword}%");
            })
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Search results fetched successfully',
            'data' => StocksResource::collection($stocks),
        ]);
    }
}
