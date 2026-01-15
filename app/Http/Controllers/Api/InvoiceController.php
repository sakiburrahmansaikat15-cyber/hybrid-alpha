<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\InvoiceItem;
use App\Http\Requests\Accounting\StoreInvoiceRequest;
use App\Http\Requests\Accounting\UpdateInvoiceRequest;
use App\Helpers\JournalHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;

class InvoiceController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:invoices.view')->only(['index', 'show']);
        $this->middleware('permission:invoices.create')->only(['store']);
        $this->middleware('permission:invoices.edit')->only(['update']);
        $this->middleware('permission:invoices.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = Invoice::with('customer');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('invoice_number', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->latest()->paginate($request->input('limit', 10));
        return response()->json($invoices);
    }

    public function store(StoreInvoiceRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();
        try {
            // Generate invoice number
            $invoiceCount = Invoice::count() + 1;
            $invoiceNumber = 'INV-' . str_pad($invoiceCount, 5, '0', STR_PAD_LEFT);

            $subtotal = 0;
            $taxTotal = 0;
            $discountTotal = 0;

            foreach ($validated['items'] as $item) {
                $lineTax = ($item['unit_price'] * $item['quantity']) * (($item['tax_rate'] ?? 0) / 100);
                $lineTotal = ($item['unit_price'] * $item['quantity']) + $lineTax - ($item['discount_amount'] ?? 0);

                $subtotal += ($item['unit_price'] * $item['quantity']);
                $taxTotal += $lineTax;
                $discountTotal += ($item['discount_amount'] ?? 0);
            }

            $total = $subtotal + $taxTotal - $discountTotal;

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'customer_id' => $validated['customer_id'],
                'invoice_date' => $validated['invoice_date'],
                'due_date' => $validated['due_date'],
                'subtotal' => $subtotal,
                'tax_amount' => $taxTotal,
                'discount_amount' => $discountTotal,
                'total_amount' => $total,
                'balance' => $total,
                'status' => $validated['status'] ?? 'sent',
                'notes' => $validated['notes'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $lineTax = ($item['unit_price'] * $item['quantity']) * (($item['tax_rate'] ?? 0) / 100);
                $lineTotal = ($item['unit_price'] * $item['quantity']) + $lineTax - ($item['discount_amount'] ?? 0);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $item['product_id'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $lineTax,
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'line_total' => $lineTotal,
                ]);
            }

            // Create Journal Entry
            JournalHelper::createInvoiceJournal($invoice);

            AuditLog::log('created', 'invoices', $invoice->id, ['invoice_number' => $invoiceNumber]);

            DB::commit();
            return response()->json($invoice->load('items'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating invoice: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $invoice = Invoice::with(['customer', 'items.product'])->findOrFail($id);
        return response()->json($invoice);
    }

    public function update(UpdateInvoiceRequest $request, $id)
    {
        $invoice = Invoice::findOrFail($id);
        $validated = $request->validated();

        DB::beginTransaction();
        try {
            // 1. Update Invoice Header
            $subtotal = collect($validated['items'])->sum(function ($item) {
                return $item['unit_price'] * $item['quantity'];
            });

            $taxAmount = collect($validated['items'])->sum(function ($item) {
                return ($item['unit_price'] * $item['quantity']) * (($item['tax_rate'] ?? 0) / 100);
            });

            $discountAmount = collect($validated['items'])->sum(fn($item) => $item['discount_amount'] ?? 0);
            $totalAmount = $subtotal + $taxAmount - $discountAmount;

            $invoice->update([
                'customer_id' => $validated['customer_id'],
                'invoice_date' => $validated['invoice_date'],
                'due_date' => $validated['due_date'],
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'balance' => $totalAmount - $invoice->paid_amount,
                'notes' => $validated['notes'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
            ]);

            // 2. Sync Items (Delete and Recreate)
            $invoice->items()->delete();

            foreach ($validated['items'] as $item) {
                $lineTax = ($item['unit_price'] * $item['quantity']) * (($item['tax_rate'] ?? 0) / 100);
                $lineTotal = ($item['unit_price'] * $item['quantity']) + $lineTax - ($item['discount_amount'] ?? 0);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $item['product_id'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $lineTax,
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'line_total' => $lineTotal,
                ]);
            }

            // 3. Sync Journal Entry
            JournalHelper::deleteRelatedJournal('INV-' . $invoice->invoice_number);
            JournalHelper::createInvoiceJournal($invoice);

            AuditLog::log('updated', 'invoices', $invoice->id, ['invoice_number' => $invoice->invoice_number]);

            DB::commit();
            return response()->json($invoice->load('items'));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating invoice: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        AuditLog::log('deleted', 'invoices', $id, ['invoice_number' => $invoice->invoice_number]);

        return response()->json(['message' => 'Invoice deleted successfully']);
    }
}
