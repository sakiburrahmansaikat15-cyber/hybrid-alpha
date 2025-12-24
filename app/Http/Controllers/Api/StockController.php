<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StocksResource;
use App\Models\Stocks;
use App\Models\Prooducts;
use App\Models\SerialList;
use Illuminate\Support\Facades\DB;
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
            'total_amount'  => 'required|numeric|min:0',
            'due_amount'    => 'nullable|numeric|min:0',
            'paid_amount'   => 'nullable|numeric|min:0',
            'stock_date'    => 'nullable|date',
            'expire_date'   => 'nullable|date',
            'comission'     => 'nullable|numeric|min:0',
            'image'         => 'nullable|file|mimes:jpg,jpeg,png,gif|max:2048',
            'status'        => 'required|in:active,inactive',

            // serial inputs
            'sku'       => 'nullable|string',
            'bar_code'  => 'nullable|string',
            'color'     => 'nullable|string',
            'note'      => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $quantity = (int) $data['quantity'];

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $folder = public_path('stock');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $imagePath = 'stock/' . $imageName;
        }

        // 🔎 Check product type
        $product = Prooducts::with('productType')->find($data['product_id']);
        $isElectronic = strtolower(optional($product->productType)->name ?? '') === 'electronic';

        // Determine if we need to create serial lists
        $hasSerialData = $isElectronic || isset($data['sku']) || isset($data['bar_code']) || isset($data['color']) || isset($data['note']) || $imagePath;

        if ($isElectronic && (!isset($data['sku']) || empty($data['sku']))) {
            return response()->json([
                'success' => false,
                'message' => 'SKU is required for electronic products',
            ], 422);
        }

        $skus = $isElectronic ? array_map('trim', explode(',', $data['sku'] ?? '')) : array_fill(0, $quantity, $data['sku'] ?? null);
        $barcodes = $isElectronic ? (isset($data['bar_code']) ? array_map('trim', explode(',', $data['bar_code'])) : array_fill(0, $quantity, null)) : array_fill(0, $quantity, $data['bar_code'] ?? null);
        $colors = $isElectronic ? (isset($data['color']) ? array_map('trim', explode(',', $data['color'])) : array_fill(0, $quantity, null)) : array_fill(0, $quantity, $data['color'] ?? null);
        $notes = $isElectronic ? (isset($data['note']) ? array_map('trim', explode(',', $data['note'])) : array_fill(0, $quantity, null)) : array_fill(0, $quantity, $data['note'] ?? null);

        if ($isElectronic) {
            if (count($skus) !== $quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'SKU count must match quantity',
                ], 422);
            }

            // Check optional fields count if provided
            if (!empty($data['color']) && count($colors) !== $quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Color count must match quantity',
                ], 422);
            }
            if (!empty($data['bar_code']) && count($barcodes) !== $quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bar code count must match quantity',
                ], 422);
            }
            if (!empty($data['note']) && count($notes) !== $quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Note count must match quantity',
                ], 422);
            }
        }

        DB::transaction(function () use ($data, $quantity, $skus, $barcodes, $colors, $notes, $hasSerialData, $imagePath) {
            // ✅ create stock (without serial fields)
            unset($data['sku'], $data['bar_code'], $data['color'], $data['note'], $data['image']);
            $stock = Stocks::create($data);

            // ✅ create serials if needed
            if ($hasSerialData) {
                for ($i = 0; $i < $quantity; $i++) {
                    SerialList::create([
                        'stock_id' => $stock->id,
                        'sku'      => $skus[$i],
                        'barcode'  => $barcodes[$i],
                        'color'    => $colors[$i],
                        'notes'    => $notes[$i],
                        'image'    => $imagePath,
                        'status'   => 'active',
                    ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Stock and serials created successfully',
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
            'paid_amount'   => 'nullable|numeric|min:0',
            'stock_date'    => 'nullable|date',
            'expire_date'   => 'nullable|date',
            'comission'     => 'nullable|numeric|min:0',
            'sku'           => 'nullable|string|max:1000',
            'color'         => 'nullable|string|max:1000',
            'bar_code'      => 'nullable|string|max:1000',
            'note'          => 'nullable|string|max:1000',
            'image'         => 'nullable|file|mimes:jpg,jpeg,png,gif|max:2048',
            'status'        => 'sometimes|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Handle image upload
        $imagePath = $stock->image; // Keep old if not new
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($imagePath && File::exists(public_path($imagePath))) {
                File::delete(public_path($imagePath));
            }

            $folder = public_path('stock');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $imagePath = 'stock/' . $imageName;
        }

        $productId = $data['product_id'] ?? $stock->product_id;
        $product = Prooducts::with('productType')->find($productId);
        $isElectronic = strtolower(optional($product->productType)->name ?? '') === 'electronic';

        $quantity = isset($data['quantity']) ? (int) $data['quantity'] : (int) $stock->quantity;

        $hasSerialData = $isElectronic || isset($data['sku']) || isset($data['color']) || isset($data['bar_code']) || isset($data['note']) || $request->hasFile('image');

        if ($hasSerialData) {
            if ($isElectronic && (!isset($data['sku']) || empty($data['sku']))) {
                return response()->json([
                    'success' => false,
                    'message' => 'SKU is required for electronic products',
                ], 422);
            }

            $skus = $isElectronic ? array_map('trim', explode(',', $data['sku'] ?? '')) : array_fill(0, $quantity, $data['sku'] ?? null);
            $barcodes = $isElectronic ? (isset($data['bar_code']) ? array_map('trim', explode(',', $data['bar_code'])) : array_fill(0, $quantity, null)) : array_fill(0, $quantity, $data['bar_code'] ?? null);
            $colors = $isElectronic ? (isset($data['color']) ? array_map('trim', explode(',', $data['color'])) : array_fill(0, $quantity, null)) : array_fill(0, $quantity, $data['color'] ?? null);
            $notes = $isElectronic ? (isset($data['note']) ? array_map('trim', explode(',', $data['note'])) : array_fill(0, $quantity, null)) : array_fill(0, $quantity, $data['note'] ?? null);

            if ($isElectronic) {
                if (count($skus) !== $quantity) {
                    return response()->json([
                        'success' => false,
                        'message' => "SKU count must match quantity. Expected: $quantity, Got: " . count($skus),
                    ], 422);
                }

                // Check optional fields
                if (isset($data['color']) && count($colors) !== $quantity) {
                    return response()->json([
                        'success' => false,
                        'message' => "Color count must match quantity. Expected: $quantity, Got: " . count($colors),
                    ], 422);
                }
                if (isset($data['bar_code']) && count($barcodes) !== $quantity) {
                    return response()->json([
                        'success' => false,
                        'message' => "Bar code count must match quantity. Expected: $quantity, Got: " . count($barcodes),
                    ], 422);
                }
                if (isset($data['note']) && count($notes) !== $quantity) {
                    return response()->json([
                        'success' => false,
                        'message' => "Note count must match quantity. Expected: $quantity, Got: " . count($notes),
                    ], 422);
                }
            }

            // Delete old serials if existing
            SerialList::where('stock_id', $id)->delete();
        }

        // Update stock (without serial fields)
        unset($data['sku'], $data['color'], $data['bar_code'], $data['note'], $data['image']);
        $stock->update($data);

        // Create new serials if needed
        if ($hasSerialData) {
            for ($i = 0; $i < $quantity; $i++) {
                SerialList::create([
                    'stock_id' => $stock->id,
                    'sku'      => $skus[$i],
                    'barcode'  => $barcodes[$i],
                    'color'    => $colors[$i],
                    'notes'    => $notes[$i],
                    'image'    => $imagePath,
                    'status'   => 'active',
                ]);
            }
        }

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

        // Delete associated serial lists (will cascade if set, but explicit delete)
        SerialList::where('stock_id', $id)->delete();

        $stock->delete();

        return response()->json([
            'success' => true,
            'message' => 'Stock deleted successfully',
        ]);
    }
}
