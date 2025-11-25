<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TransactionsController extends Controller
{
    public function index()
    {
        $transactions = Transaction::latest()->get();
        return TransactionResource::collection($transactions);
    }

    // ✅ Store a new transaction
    public function store(Request $request)
    {
        $data = $request->validate([
            'stock_id' => 'required|exists:stocks,id',
            'payment_type_id' => 'required|exists:payment_types,id',
            'type' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
           'status' => 'required|in:active,inactive',
        ]);

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
        $transaction = Transaction::findOrFail($id);

        if(!$transaction){
            return response()->json("message:data not found");
        }

        return new TransactionResource($transaction);
    }

    // ✅ Update a transaction
    public function update(Request $request, $id)
    {
        $transaction = Transaction::findOrFail($id);

        $data = $request->validate([
            'stock_id' => 'nullable|exists:stocks,id',
            'payment_type_id' => 'nullable|exists:payment_types,id',
            'type' => 'nullable|string|max:255',
            'amount' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        $transaction->update($data);
        $transaction->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully',
            'data' => new TransactionResource($transaction)
        ], 200);
    }

    // ✅ Delete a transaction
    public function destroy($id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaction deleted successfully'
        ]);
    }
}
