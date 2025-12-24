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
        $query->where(function ($q) use ($keyword) {
            $q->orWhereHas('product', function ($sub) use ($keyword) {
                $sub->where('name', 'like', "%{$keyword}%");
            })
              ->orWhereHas('vendor', function ($sub) use ($keyword) {
                  $sub->where('name', 'like', "%{$keyword}%");
              })
              ->orWhereHas('warehouse', function ($sub) use ($keyword) {
                  $sub->where('name', 'like', "%{$keyword}%");
              });
        });
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
            $folder = public_path('serial_images');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $imagePath = 'serial_images/' . $imageName;
        }

        // Check product type
        $product = Prooducts::with('productType')->find($data['product_id']);
        $isElectronic = strtolower(optional($product->productType)->name ?? '') === 'electronic';

        // Determine serial data
        $hasSerialData = $isElectronic || isset($data['sku']) || isset($data['bar_code']) || isset($data['color']) || isset($data['note']) || $imagePath;

        if ($isElectronic && (!isset($data['sku']) || empty($data['sku']))) {
            return response()->json([
                'success' => false,
                'message' => 'SKU is required for electronic products',
            ], 422);
        }

        $skus = $isElectronic ? array_map('trim', explode(',', $data['sku'] ?? '')) : [$data['sku'] ?? null];
        $barcodes = $isElectronic ? (isset($data['bar_code']) ? array_map('trim', explode(',', $data['bar_code'])) : array_fill(0, $quantity, null)) : [$data['bar_code'] ?? null];
        $colors = $isElectronic ? (isset($data['color']) ? array_map('trim', explode(',', $data['color'])) : array_fill(0, $quantity, null)) : [$data['color'] ?? null];
        $notes = $isElectronic ? (isset($data['note']) ? array_map('trim', explode(',', $data['note'])) : array_fill(0, $quantity, null)) : [$data['note'] ?? null];

        if ($isElectronic) {
            if (count($skus) !== $quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'SKU count must match quantity',
                ], 422);
            }
        }

        DB::transaction(function () use ($data, $quantity, $skus, $barcodes, $colors, $notes, $hasSerialData, $imagePath, $isElectronic) {
            unset($data['sku'], $data['bar_code'], $data['color'], $data['note'], $data['image']);
            $stock = Stocks::create($data);

            if ($hasSerialData) {
                if ($isElectronic) {
                    // Electronic → one serial per item
                    for ($i = 0; $i < $quantity; $i++) {
                        SerialList::create([
                            'stock_id' => $stock->id,
                            'sku'      => $skus[$i],
                            'barcode'  => $barcodes[$i] ?? null,
                            'color'    => $colors[$i] ?? null,
                            'notes'    => $notes[$i] ?? null,
                            'image'    => $imagePath,
                            'status'   => 'active',
                        ]);
                    }
                } else {
                    // Non-electronic → only one serial entry
                    SerialList::create([
                        'stock_id' => $stock->id,
                        'sku'      => $skus[0] ?? null,
                        'barcode'  => $barcodes[0] ?? null,
                        'color'    => $colors[0] ?? null,
                        'notes'    => $notes[0] ?? null,
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
        'product_id'    => 'nullable|exists:prooducts,id',
        'vendor_id'     => 'nullable|exists:vendors,id',
        'warehouse_id'  => 'nullable|exists:warehouses,id',
        'quantity'      => 'nullable|integer|min:1',
        'buying_price'  => 'nullable|numeric|min:0',
        'selling_price' => 'nullable|numeric|min:0',
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
    $imagePath = $stock->image;
    if ($request->hasFile('image')) {
        if ($imagePath && File::exists(public_path($imagePath))) {
            File::delete(public_path($imagePath));
        }

        $folder = public_path('serial_images');
        if (!File::exists($folder)) {
            File::makeDirectory($folder, 0777, true);
        }

        $image = $request->file('image');
        $imageName = time() . '_' . $image->getClientOriginalName();
        $image->move($folder, $imageName);
        $imagePath = 'serial_images/' . $imageName;
    }

    $productId = $data['product_id'] ?? $stock->product_id;
    $product = Prooducts::with('productType')->find($productId);
    $isElectronic = strtolower(optional($product->productType)->name ?? '') === 'electronic';

    $quantity = isset($data['quantity']) ? (int) $data['quantity'] : (int) $stock->quantity;

    // Only process serial data if any serial-related field is sent
    $hasSerialData = isset($data['sku']) || isset($data['color']) || isset($data['bar_code']) || isset($data['note']) || $request->hasFile('image');

    // ONLY enforce SKU requirement if user is trying to update serial data AND it's electronic
    if ($hasSerialData && $isElectronic) {
        if (!isset($data['sku']) || empty(trim($data['sku']))) {
            return response()->json([
                'success' => false,
                'message' => 'SKU is required for electronic products when updating item details',
            ], 422);
        }

        $skus = array_map('trim', explode(',', $data['sku']));
        if (count($skus) !== $quantity) {
            return response()->json([
                'success' => false,
                'message' => 'Number of SKUs must match quantity for electronic products',
            ], 422);
        }
    }

    // Delete old serials only if new serial data is being provided
    if ($hasSerialData) {
        SerialList::where('stock_id', $id)->delete();
    }

    // Remove serial fields from main stock update
    unset($data['sku'], $data['color'], $data['bar_code'], $data['note'], $data['image']);

    // Update main stock fields
    $stock->update($data);

    // Recreate serials only if serial data was provided
    if ($hasSerialData) {
        $skus     = $isElectronic ? array_map('trim', explode(',', $data['sku'] ?? '')) : [$data['sku'] ?? null];
        $barcodes = $isElectronic ? ($data['bar_code'] ?? null ? array_map('trim', explode(',', $data['bar_code'])) : array_fill(0, $quantity, null)) : [$data['bar_code'] ?? null];
        $colors   = $isElectronic ? ($data['color'] ?? null ? array_map('trim', explode(',', $data['color'])) : array_fill(0, $quantity, null)) : [$data['color'] ?? null];
        $notes    = $isElectronic ? ($data['note'] ?? null ? array_map('trim', explode(',', $data['note'])) : array_fill(0, $quantity, null)) : [$data['note'] ?? null];

        if ($isElectronic) {
            for ($i = 0; $i < $quantity; $i++) {
                SerialList::create([
                    'stock_id' => $stock->id,
                    'sku'      => $skus[$i] ?? null,
                    'barcode'  => $barcodes[$i] ?? null,
                    'color'    => $colors[$i] ?? null,
                    'notes'    => $notes[$i] ?? null,
                    'image'    => $imagePath,
                    'status'   => 'active',
                ]);
            }
        } else {
            SerialList::create([
                'stock_id' => $stock->id,
                'sku'      => $skus[0] ?? null,
                'barcode'  => $barcodes[0] ?? null,
                'color'    => $colors[0] ?? null,
                'notes'    => $notes[0] ?? null,
                'image'    => $imagePath,
                'status'   => 'active',
            ]);
        }
    }

    return response()->json([
        'success' => true,
        'message' => 'Stock updated successfully',
        'data'    => new StocksResource($stock->fresh()),
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

        SerialList::where('stock_id', $id)->delete();
        $stock->delete();

        return response()->json([
            'success' => true,
            'message' => 'Stock deleted successfully',
        ]);
    }
}
