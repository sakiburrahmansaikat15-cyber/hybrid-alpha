<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use Illuminate\Http\Request;

class StockController extends Controller
{
    // LIST
    public function index()
    {
        return response()->json(
            Stock::with(['vendor', 'product', 'warehouse'])->get()
        );
    }

    // CREATE
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'vendor_id'      => 'required|exists:vendors,id',
            'product_id'     => 'required|exists:products,id',
            'warehouse_id'   => 'required|exists:warehouses,id',
            'quantity'       => 'required|integer|min:1',
            'buying_price'   => 'required|numeric',
            'selling_price'  => 'required|numeric',
            'total_amount'   => 'required|numeric',
            'due_amount'     => 'required|numeric',
            'stock_date'     => 'required|date',
            'commission'     => 'nullable|numeric',
            'sku'            => 'nullable|string',
            'barcode'        => 'nullable|string',
            'status'         => 'required|boolean',
        ]);

        $stock = Stock::create($validated);

        return response()->json($stock, 201);
    }

    // SHOW
    public function show($id)
    {
        return response()->json(
            Stock::with(['vendor', 'product', 'warehouse'])->findOrFail($id)
        );
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $stock = Stock::findOrFail($id);

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'vendor_id'      => 'required|exists:vendors,id',
            'product_id'     => 'required|exists:products,id',
            'warehouse_id'   => 'required|exists:warehouses,id',
            'quantity'       => 'required|integer|min:1',
            'buying_price'   => 'required|numeric',
            'selling_price'  => 'required|numeric',
            'total_amount'   => 'required|numeric',
            'due_amount'     => 'required|numeric',
            'stock_date'     => 'required|date',
            'commission'     => 'nullable|numeric',
            'sku'            => 'nullable|string',
            'barcode'        => 'nullable|string',
            'status'         => 'required|boolean',
        ]);

        $stock->update($validated);

        return response()->json($stock);
    }

    // DELETE
    public function destroy($id)
    {
        $stock = Stock::findOrFail($id);
        $stock->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    // SEARCH
    public function search(Request $request)
    {
        $search = $request->search;

        $results = Stock::where('name', 'like', "%{$search}%")
            ->orWhere('sku', 'like', "%{$search}%")
            ->orWhere('barcode', 'like', "%{$search}%")
            ->orWhereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->orWhereHas('vendor', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->get();

        return response()->json($results);
    }
}
