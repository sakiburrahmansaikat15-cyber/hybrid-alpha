<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentType;
use Illuminate\Http\Request;

class PaymentTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentType::query();

        if ($request->filled('search')) {
            $query->where('type', 'like', "%{$request->search}%");
        }

        $limit = $request->input('limit', 10);
        $paymentTypes = $query->paginate($limit);

        return response()->json($paymentTypes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:255',
            'amount_number' => 'required|numeric',
            'notes' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,png,jpeg',
            'status' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $filename = time().'_'.$request->image->getClientOriginalName();
            $request->image->move(public_path('payment_types'), $filename);
            $validated['image'] = 'payment_types/' . $filename;
        }

        $paymentType = PaymentType::create($validated);

        return response()->json($paymentType, 201);
    }

    public function show($id)
    {
        $paymentType = PaymentType::findOrFail($id);
        return response()->json($paymentType);
    }

    public function update(Request $request, $id)
    {
        $paymentType = PaymentType::findOrFail($id);

        $validated = $request->validate([
            'type' => 'sometimes|string|max:255',
            'amount_number' => 'sometimes|numeric',
            'notes' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,png,jpeg',
            'status' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $filename = time().'_'.$request->image->getClientOriginalName();
            $request->image->move(public_path('payment_types'), $filename);
            $validated['image'] = 'payment_types/' . $filename;
        }

        $paymentType->update($validated);

        return response()->json($paymentType);
    }

    public function destroy($id)
    {
        $paymentType = PaymentType::findOrFail($id);
        $paymentType->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
