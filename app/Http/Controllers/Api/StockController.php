<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StocksResource;
use App\Models\Stocks;
use App\Models\Prooducts;
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

        if ($keyword) {
            $query->where('sku', 'like', "%{$keyword}%")
                ->orWhereHas('product', fn($q) => $q->where('name', 'like', "%{$keyword}%"))
                ->orWhereHas('vendor', fn($q) => $q->where('name', 'like', "%{$keyword}%"));
        }

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
            'product_id' => 'required|exists:prooducts,id',
            'vendor_id' => 'nullable|exists:vendors,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'quantity' => 'required|integer|min:1',
            'buying_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'stock_date' => 'nullable|date',
            'comission' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,inactive',
            'sku' => 'nullable|string|max:1000', // frontend must provide for electronics
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        $product = Prooducts::with('productType')->find($data['product_id']);
        $isElectronic = strtolower(optional($product->productType)->name ?? '') === 'electronic';

        if ($isElectronic) {
            // Electronics must provide SKUs equal to quantity
            if (empty($data['sku'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Electronic products require SKUs for each quantity. Provide comma-separated SKUs.',
                ], 422);
            }

            $skuList = explode(',', $data['sku']);
            if (count($skuList) != $data['quantity']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Number of SKUs must match the quantity for electronic products.',
                ], 422);
            }

            $data['sku'] = implode(',', array_map('trim', $skuList));
        } else {
            // Non-electronics: 1 SKU is enough, quantity doesn't matter
            if (empty($data['sku'])) {
                $data['sku'] = 'SKU-' . strtoupper(uniqid());
            }
        }

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

        $validator = Validator::make($request->all(), [
            'product_id' => 'sometimes|exists:prooducts,id',
            'vendor_id' => 'sometimes|exists:vendors,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'quantity' => 'sometimes|integer|min:1',
            'buying_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'stock_date' => 'nullable|date',
            'comission' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
            'sku' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        $productId = $data['product_id'] ?? $stock->product_id;
        $product = Prooducts::with('productType')->find($productId);
        $isElectronic = strtolower(optional($product->productType)->name ?? '') === 'electronic';

        $quantity = $data['quantity'] ?? $stock->quantity;

        if ($isElectronic) {
            if (empty($data['sku'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Electronic products require SKUs for each quantity.',
                ], 422);
            }

            $skuList = explode(',', $data['sku']);
            if (count($skuList) != $quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Number of SKUs must match the quantity for electronic products.',
                ], 422);
            }

            $data['sku'] = implode(',', array_map('trim', $skuList));
        } else {
            if (empty($data['sku'])) {
                $data['sku'] = $stock->sku ?? 'SKU-' . strtoupper(uniqid());
            }
        }

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
