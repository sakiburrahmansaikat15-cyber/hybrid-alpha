<?php

namespace App\Http\Controllers\Api;


use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;


class TransactionController extends Controller {


public function index(Request $request) {
$query = Transaction::with(['stock','paymentType']);


if ($request->search) {
$query->where('type', 'like', '%' . $request->search . '%');
}


$limit = $request->limit ?? 10;


return $query->paginate($limit);
}


public function store(Request $request) {
$data = $request->validate([
'type' => 'required|string',
'amount' => 'required|numeric',
'stock_id' => 'required|exists:stocks,id',
'payment_type_id' => 'required|exists:payment_types,id',
'image' => 'nullable|image|mimes:jpg,png,jpeg',
'status' => 'boolean'
]);


if ($request->hasFile('image')) {
$filename = time().'_'.$request->image->getClientOriginalName();
$request->image->move(public_path('transactions'), $filename);
$data['image'] = 'transactions/' . $filename;
}


return Transaction::create($data);
}


public function show($id) {
return Transaction::with(['stock','paymentType'])->findOrFail($id);
}


public function update(Request $request, $id) {
$transaction = Transaction::findOrFail($id);


$data = $request->validate([
'type' => 'sometimes|string',
'amount' => 'sometimes|numeric',
'stock_id' => 'sometimes|exists:stocks,id',
'payment_type_id' => 'sometimes|exists:payment_types,id',
'image' => 'nullable|image|mimes:jpg,png,jpeg',
'status' => 'boolean'
]);


if ($request->hasFile('image')) {
$filename = time().'_'.$request->image->getClientOriginalName();
$request->image->move(public_path('transactions'), $filename);
$data['image'] = 'transactions/' . $filename;
}


$transaction->update($data);
return $transaction;
}


public function destroy($id) {
$transaction = Transaction::findOrFail($id);
$transaction->delete();
return response()->json(['message' => 'Deleted successfully']);
}
}
