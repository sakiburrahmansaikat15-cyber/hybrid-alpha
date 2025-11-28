<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TransactionsController extends Controller
{
    // ✅ List transactions with pagination
      public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = (int) $request->query('limit', 10);

        $query = Transaction::with(['paymentType']);


        // 🔍 Apply search if keyword provided
        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('type', 'like', "%{$keyword}%")
                  ->orWhereHas('paymentType', function ($q) use ($keyword) {
                      $q->where('name', 'like', "%{$keyword}%");
                  });
            });
        }

        // 📄 Paginate results
        $transactions = $query->latest()->paginate($limit);

        // ✅ Return response
        return response()->json([
            'message' => 'Transactions fetched successfully',
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'per_page' => $transactions->perPage(),
                'total_items' => $transactions->total(),
                'total_pages' => $transactions->lastPage(),
                 'data' => TransactionResource::collection($transactions),
            ],
        ]);
    }


    // ✅ Store a new transaction
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'stock_id' => 'required|exists:stocks,id',
            'payment_type_id' => 'required|exists:payment_types,id',
            'type' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $transaction = Transaction::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => new TransactionResource($transaction)
        ], 201);
    }

    // ✅ Show a single transaction
    public function show($id)
    {
        $transaction = Transaction::with(['paymentType'])->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new TransactionResource($transaction),
        ], 200);
    }

    // ✅ Update a transaction
    public function update(Request $request, $id)
    {
        $transaction = Transaction::find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
            ], 404);
        }

        $data = $request->validate([
            'stock_id' => 'nullable|exists:stocks,id',
            'payment_type_id' => 'nullable|exists:payment_types,id',
            'type' => 'nullable|string|max:255',
            'amount' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        $transaction->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully',
            'data' => new TransactionResource($transaction),
        ], 200);
    }

    // ✅ Delete a transaction
    public function destroy($id)
    {
        $transaction = Transaction::find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
            ], 404);
        }

        $transaction->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaction deleted successfully',
        ], 200);
    }
}
