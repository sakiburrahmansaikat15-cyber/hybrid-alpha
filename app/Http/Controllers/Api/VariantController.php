<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Variant;
use Illuminate\Http\Request;

class VariantController extends Controller
{
    // LIST ALL
    public function index()
    {
        return response()->json(
            Variant::with('product')->get()
        );
    }

    // CREATE
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id'  => 'nullable|exists:products,id',
            'name'        => 'required|string|max:255',
            'value'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'meta'        => 'nullable|array',
            'status'      => 'required|boolean',
        ]);

        // Convert empty product to null
        $validated['product_id'] = $validated['product_id'] ?: null;

        $variant = Variant::create($validated);

        return response()->json($variant, 201);
    }

    // SHOW
    public function show($id)
    {
        return response()->json(
            Variant::with('product')->findOrFail($id)
        );
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $variant = Variant::findOrFail($id);

        $validated = $request->validate([
            'product_id'  => 'nullable|exists:products,id',
            'name'        => 'required|string|max:255',
            'value'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'meta'        => 'nullable|array',
            'status'      => 'required|boolean',
        ]);

        $validated['product_id'] = $validated['product_id'] ?: null;

        $variant->update($validated);

        return response()->json($variant);
    }

    // DELETE
    public function destroy($id)
    {
        $variant = Variant::findOrFail($id);
        $variant->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    // SEARCH
    public function search(Request $request)
    {
        $search = $request->search;

        $results = Variant::where('name', 'like', "%{$search}%")
            ->orWhere('value', 'like', "%{$search}%")
            ->orWhereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->get();

        return response()->json($results);
    }
}
