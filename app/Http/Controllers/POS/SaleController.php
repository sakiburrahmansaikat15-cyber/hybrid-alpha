<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\Sale;
use Illuminate\Http\Request;
use App\Http\Requests\POS\StoreSaleRequest;
use App\Http\Requests\POS\UpdateSaleRequest;
use App\Helpers\JournalHelper;

class SaleController extends Controller
{
    /**
     * 📋 Display a listing of the sales with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Sale::select('id', 'invoice_no', 'total_amount', 'status', 'terminal_id', 'customer_id', 'created_at')
            ->with([
                'terminal:id,name',
                'customer:id,name'
            ]);

        if ($keyword) {
            $query->where('invoice_no', 'like', "%{$keyword}%")
                ->orWhereHas('customer', function ($q) use ($keyword) {
                    $q->where('name', 'like', "%{$keyword}%");
                });
        }

        // 📄 Enforce pagination to handle high transaction volumes
        $limit = (int) ($limit ?: 15);
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

    public function store(StoreSaleRequest $request)
    {
        $validated = $request->validated();

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            // 1. Generate Sale Number (Invoice No)
            $count = Sale::max('id') + 1;
            $saleNumber = 'SALE-' . date('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            // 2. Create Sale Header
            // Mapping Controller logic to Model fields (Sale.php uses sale_number, not invoice_no)
            $sale = Sale::create([
                'sale_number' => $saleNumber,
                'terminal_id' => $validated['terminal_id'],
                'customer_id' => $validated['customer_id'] ?? null,
                'sale_date' => now(), // Default to now
                'subtotal' => $validated['subtotal'] ?? 0,
                'tax_amount' => $validated['tax_amount'] ?? 0,
                'discount_amount' => $validated['discount_amount'] ?? 0,
                'total_amount' => $validated['total_amount'], // or payable_amount
                'paid_amount' => $validated['paid_amount'] ?? 0,
                'payment_status' => $validated['payment_status'] ?? 'pending',
                'status' => $validated['status'] ?? 'completed',
                'notes' => $validated['notes'] ?? null,
            ]);

            // 3. Process Items & Deduct Inventory
            foreach ($validated['items'] as $itemData) {
                // Save Sale Item
                \App\Models\POS\SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'subtotal' => $itemData['subtotal'] ?? ($itemData['quantity'] * $itemData['unit_price']),
                    'tax_amount' => $itemData['tax_amount'] ?? 0,
                    'discount_amount' => $itemData['discount_amount'] ?? 0,
                    'total' => $itemData['total'] ?? ($itemData['quantity'] * $itemData['unit_price']),
                ]);

                // 📦 Inventory Deduction
                // Use specific stock_id if provided (best for accurate batch tracking)
                $stock = null;
                if (!empty($itemData['stock_id'])) {
                    $stock = \App\Models\Stocks::find($itemData['stock_id']);
                }

                // Fallback: Find any stock record for this product with enough qty
                if (!$stock) {
                    $stock = \App\Models\Stocks::where('product_id', $itemData['product_id'])
                        ->where('quantity', '>=', $itemData['quantity'])
                        ->first();
                }

                // Deep Fallback: Just get the first one (might go negative, but records transaction)
                if (!$stock) {
                    $stock = \App\Models\Stocks::where('product_id', $itemData['product_id'])->first();
                }

                if ($stock) {
                    $stock->decrement('quantity', $itemData['quantity']);
                }
            }

            // 4. Process Payments
            if (isset($validated['payments'])) {
                foreach ($validated['payments'] as $paymentData) {
                    \App\Models\POS\SalePayment::create([
                        'sale_id' => $sale->id,
                        'payment_method_id' => $paymentData['payment_method_id'],
                        'amount' => $paymentData['amount'],
                        'reference' => $paymentData['reference'] ?? null,
                        'status' => 'completed',
                    ]);
                }
            }

            // 5. Automated Journaling (Optional)
            if (method_exists(JournalHelper::class, 'createSaleJournal')) {
                JournalHelper::createSaleJournal($sale);
            }

            return response()->json([
                'success' => true,
                'message' => 'Checkout completed successfully',
                'invoice_no' => $saleNumber,
                'data' => $sale->load(['items', 'payments']),
            ], 201);
        });
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
    public function update(UpdateSaleRequest $request, $id)
    {
        $sale = Sale::find($id);

        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Sale not found',
            ], 404);
        }

        $sale->update($request->validated());

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

    public function getReceipt($id)
    {
        $sale = Sale::with(['terminal', 'customer', 'items.product', 'payments.method', 'taxes', 'discounts'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'receipt' => [
                'business_name' => config('app.name', 'Hybrid Alpha ERP'),
                'invoice_no' => $sale->invoice_no,
                'date' => $sale->created_at->format('Y-m-d H:i:s'),
                'terminal' => $sale->terminal->name ?? 'N/A',
                'customer' => $sale->customer->name ?? 'Walk-in Customer',
                'items' => collect($sale->items)->map(function ($item) {
                    return [
                        'name' => $item->product->name ?? $item->description,
                        'qty' => $item->quantity,
                        'price' => $item->unit_price,
                        'total' => $item->subtotal
                    ];
                }),
                'subtotal' => $sale->total_amount,
                'tax' => $sale->tax_amount,
                'discount' => $sale->discount_amount,
                'total' => $sale->payable_amount,
                'payments' => collect($sale->payments)->map(function ($p) {
                    return [
                        'method' => $p->method->name ?? 'Cash',
                        'amount' => $p->amount
                    ];
                }),
                'notes' => 'Thank you for your business!'
            ]
        ]);
    }
}
