<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReceiptsController extends Controller
{
    /**
     * 📋 Display a listing of the receipts with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Receipt::with('sale');

        // 🔍 Apply search filter (by receipt number or sale invoice number)
        if ($keyword) {
            $query->where('receipt_no', 'like', "%{$keyword}%")
                  ->orWhereHas('sale', function ($q) use ($keyword) {
                      $q->where('invoice_no', 'like', "%{$keyword}%");
                  });
        }

        // ⚙️ If no limit provided, return all receipts
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Receipts fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => $data,
                ],
            ]);
        }

        // 📄 Paginate results
        $limit = (int) $limit ?: 10;
        $receipts = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Receipts fetched successfully',
            'pagination' => [
                'current_page' => $receipts->currentPage(),
                'per_page' => $receipts->perPage(),
                'total_items' => $receipts->total(),
                'total_pages' => $receipts->lastPage(),
                'data' => $receipts->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created receipt
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sale_id'    => 'required|exists:sales,id',
            'receipt_no' => 'required|string|max:255|unique:receipts,receipt_no',
            'sent_via'   => 'nullable|in:print,email,sms,whatsapp',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $receipt = Receipt::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Receipt created successfully',
            'data'    => $receipt->load('sale'),
        ], 201);
    }

    /**
     * 👁️ Show details of a specific receipt
     */
    public function show($id)
    {
        $receipt = Receipt::with('sale')->find($id);

        if (!$receipt) {
            return response()->json([
                'success' => false,
                'message' => 'Receipt not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $receipt,
        ], 200);
    }

    /**
     * ✏️ Update an existing receipt
     */
    public function update(Request $request, $id)
    {
        $receipt = Receipt::find($id);

        if (!$receipt) {
            return response()->json([
                'success' => false,
                'message' => 'Receipt not found',
            ], 404);
        }

        $data = $request->validate([
            'sale_id'    => 'sometimes|exists:sales,id',
            'receipt_no' => 'sometimes|string|max:255|unique:receipts,receipt_no,' . $receipt->id,
            'sent_via'   => 'nullable|in:print,email,sms,whatsapp',
        ]);

        $receipt->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Receipt updated successfully',
            'data' => $receipt->load('sale'),
        ], 200);
    }

    /**
     * ❌ Delete a receipt
     */
    public function destroy($id)
    {
        $receipt = Receipt::find($id);

        if (!$receipt) {
            return response()->json([
                'success' => false,
                'message' => 'Receipt not found',
            ], 404);
        }

        $receipt->delete();

        return response()->json([
            'success' => true,
            'message' => 'Receipt deleted successfully',
        ], 200);
    }
}
