<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\transactions;
use Illuminate\Http\Request;

class TransactionsController extends Controller
{
     public function index(Request $request)
    {
        $limit = $request->limit ?? 10; // default limit = 10

        $transactions = transactions::paginate($limit);

        return response()->json($transactions);
    }

    // CREATE
    public function store(Request $request)
    {

        $validated = $request->validate([
            'type'             => 'required|string|max:255',
            'amount'           => 'required|numeric',
            'status'           => 'required|string|max:255',
            // 'stock_id'         => 'required',
            // 'payment_type_id'  => 'required',
        ]);

        $transaction = transactions::create($validated);

        return response()->json($transaction, 201);
    }


    public function show($id)
    {
        $transaction = transactions::findOrFail($id);
        return response()->json($transaction);
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $transaction = transactions::findOrFail($id);

        $validated = $request->validate([
            'type'             => 'required|string|max:255',
            'amount'           => 'required|numeric',
            'status'           => 'required|string|max:255',
            'stock_id'         => 'required|exists:stocks,id',
            'payment_type_id'  => 'required|exists:product_types,id',
        ]);

        $transaction->update($validated);

        return response()->json($transaction);
    }


    public function destroy($id)
    {
        $transaction = transactions::findOrFail($id);
        $transaction->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }


    public function search(Request $request)
    {
        $search = $request->search;

        $results = transactions::where('type', 'like', "%{$search}%")
            ->orWhere('status', 'like', "%{$search}%")
            ->get();

        return response()->json($results);
    }
}
