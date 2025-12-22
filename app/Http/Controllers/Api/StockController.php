<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StocksResource;
use App\Models\Stocks;
use App\Models\Prooducts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class StockController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit   = (int) $request->query('limit', 10);
        $page    = (int) $request->query('page', 1);

        $query = Stocks::with(['product', 'vendor', 'warehouse']);

        if ($keyword) {
            $query->where('sku', 'like', "%{$keyword}%")
                  ->orWhereHas('product', fn($q) => $q->where('name', 'like', "%{$keyword}%"))
                  ->orWhereHas('vendor', fn($q) => $q->where('name', 'like', "%{$keyword}%"));
        }

        $stocks = $query->latest()->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message'       => 'Stocks fetched successfully',
            'current_page'  => $stocks->currentPage(),
            'per_page'      => $stocks->perPage(),
            'total_items'   => $stocks->total(),
            'total_pages'   => $stocks->lastPage(),
            'data'          => StocksResource::collection($stocks->items()),
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id'    => 'required|exists:prooducts,id',
            'vendor_id'     => 'nullable|exists:vendors,id',
            'warehouse_id'  => 'nullable|exists:warehouses,id',
            'quantity'      => 'required|integer|min:1',
            'buying_price'  => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'total_amount'  => 'nullable|numeric|min:0',
            'due_amount'    => 'nullable|numeric|min:0',
            'stock_date'    => 'nullable|date',
            'expire_date'    => 'nullable|date',
            'color'    => 'nullable|string|max:1000',
            'bar_code' => 'nullable|string|max:1000',
            "paid_amount" => 'nullable|numeric|min:0',
            'image'    => 'nullable|string|max:1000',
            'note'    => 'nullable|string|max:1000',
            'comission'     => 'nullable|numeric|min:0',
            'status'        => 'required|in:active,inactive',
            'sku'           => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();



        if ($request->hasFile('image')) {
            $folder = public_path('stock');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'stock/' . $imageName;
        }

        $product = Prooducts::with('productType')->find($data['product_id']);
        $isElectronic = strtolower(optional($product->productType)->name ?? '') === 'electronic';

       if ($isElectronic) {

    if (empty($data['sku'])) {
        return response()->json([
            'success' => false,
            'message' => 'Electronic products require SKUs.',
        ], 422);
    }

    $skus = array_map('trim', explode(',', $data['sku']));
    if (count($skus) !== $data['quantity']) {
        return response()->json([
            'success' => false,
            'message' => 'SKU count must match quantity.',
        ], 422);
    }

    $data['sku'] = implode(',', $skus);

    if ($data['color']) {
        $colors = array_map('trim', explode(',', $data['color']));
        if (count($colors) !== $data['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Color count must match quantity.',
            ], 422);
        }
        $data['color'] = implode(',', $colors);
    }

    if ($data['bar_code']) {
        $codes = array_map('trim', explode(',', $data['bar_code']));
        if (count($codes) !== $data['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Bar code count must match quantity.',
            ], 422);
        }
        $data['bar_code'] = implode(',', $codes);
    }

     if ($data['note']) {
        $codes = array_map('trim', explode(',', $data['note']));
        if (count($codes) !== $data['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Bar code count must match quantity.',
            ], 422);
        }
        $data['note'] = implode(',', $codes);
    }
}

        $stock = Stocks::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Stock created successfully',
            'data'    => new StocksResource($stock),
        ], 201);
    }

    public function show($id)
    {
        $stock = Stocks::with(['product', 'vendor', 'warehouse'])->find($id);

        if (!$stock) {
            return response()->json([
                'success' => false,
                'message' => 'Stock not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new StocksResource($stock),
        ]);
    }

    public function update(Request $request, $id)
    {
        $stock = Stocks::find($id);

        if (!$stock) {
            return response()->json([
                'success' => false,
                'message' => 'Stock not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'product_id'    => 'sometimes|exists:prooducts,id',
            'vendor_id'     => 'sometimes|exists:vendors,id',
            'warehouse_id'  => 'nullable|exists:warehouses,id',
            'quantity'      => 'sometimes|integer|min:1',
            'buying_price'  => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'total_amount'  => 'nullable|numeric|min:0',
            'due_amount'    => 'nullable|numeric|min:0',
            'stock_date'    => 'nullable|date',
            'comission'     => 'nullable|numeric|min:0',
             'expire_date'    => 'nullable|date',
            'color'    => 'nullable|string|max:1000',
            'bar_code' => 'nullable|string|max:1000',
            "paid_amount" =>'nullable|numeric|min:0',
             'image'    => 'nullable|string|max:1000',
            'note'    => 'nullable|string|max:1000',
            'status'        => 'sometimes|in:active,inactive',
            'sku'           => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

         if ($request->hasFile('image')) {
            if ($stock->image && File::exists(public_path($stock->image))) {
                File::delete(public_path($stock->image));
            }

            $folder = public_path('stock');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'stock/' . $imageName;
        }

        $productId = $data['product_id'] ?? $stock->product_id;
        $product = Prooducts::with('productType')->find($productId);
        $isElectronic = strtolower(optional($product->productType)->name ?? '') === 'electronic';

        $quantity = $data['quantity'] ?? $stock->quantity;

           if ($isElectronic) {

    if (empty($data['sku'])) {
        return response()->json([
            'success' => false,
            'message' => 'Electronic products require SKUs.',
        ], 422);
    }

    $skus = array_map('trim', explode(',', $data['sku']));
    if (count($skus) !== $data['quantity']) {
        return response()->json([
            'success' => false,
            'message' => 'SKU count must match quantity.',
        ], 422);
    }

    $data['sku'] = implode(',', $skus);

    if ($data['color']) {
        $colors = array_map('trim', explode(',', $data['color']));
        if (count($colors) !== $data['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Color count must match quantity.',
            ], 422);
        }
        $data['color'] = implode(',', $colors);
    }

    if ($data['bar_code']) {
        $codes = array_map('trim', explode(',', $data['bar_code']));
        if (count($codes) !== $data['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Bar code count must match quantity.',
            ], 422);
        }
        $data['bar_code'] = implode(',', $codes);
    }

     if ($data['note']) {
        $codes = array_map('trim', explode(',', $data['note']));
        if (count($codes) !== $data['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Bar code count must match quantity.',
            ], 422);
        }
        $data['note'] = implode(',', $codes);
    }
}

        $stock->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Stock updated successfully',
            'data'    => new StocksResource($stock),
        ]);
    }

    public function destroy($id)
    {
        $stock = Stocks::find($id);

        if (!$stock) {
            return response()->json([
                'success' => false,
                'message' => 'Stock not found',
            ], 404);
        }

          if ($stock->image && File::exists(public_path($stock->image))) {
            File::delete(public_path($stock->image));
        }

        $stock->delete();

        return response()->json([
            'success' => true,
            'message' => 'Stock deleted successfully',
        ]);
    }
}
