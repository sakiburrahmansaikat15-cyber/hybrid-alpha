<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StocksResource;
use App\Models\Stocks;
use Illuminate\Http\Request;

class StockController extends Controller
{
    // List all stocks
    public function index()
    {
        $stocks = Stocks::all();
        return response()->json([
            'success' => true,
            'data' => StocksResource::collection($stocks)
        ]);
    }

    // Store a new stock
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'vendor_id' => 'required|exists:vendors,id',
            'quantity' => 'required|integer|min:0',
            'buying_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'total_amount' => 'sometimes|numeric|min:0',
            'due_amount' => 'sometimes|numeric|min:0',
            'stock_date' => 'nullable|date',
            'comission' => 'nullable|numeric|min:0',
            'status' => 'sometimes|boolean',
            'sku' => 'nullable|string|max:255',
        ]);

        $stock = Stocks::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Stock created successfully',
            'data' => new StocksResource($stock)
        ], 201);
    }

    // Show a single stock
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
        ]);
    }

    // Update a stock
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
            'total_amount' => 'sometimes|numeric|min:0',
            'due_amount' => 'sometimes|numeric|min:0',
            'stock_date' => 'nullable|date',
            'comission' => 'nullable|numeric|min:0',
            'status' => 'sometimes|boolean',
            'sku' => 'nullable|string|max:255',
        ]);

        $stock->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Stock updated successfully',
            'data' => new StocksResource($stock)
        ]);
    }

    // Delete a stock
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
        ]);
    }
}
