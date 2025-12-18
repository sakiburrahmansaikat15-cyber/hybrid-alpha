<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\SaleTax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SaleTaxController extends Controller
{
    /**
     * 📋 Display a listing of the sale taxes with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = SaleTax::with(['sale', 'taxRate']);

        // 🔍 Apply search filter
        if ($keyword) {
            $query->whereHas('sale', function ($q) use ($keyword) {
                $q->where('invoice_no', 'like', "%{$keyword}%");
            })->orWhereHas('taxRate', function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%");
            });
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Sale taxes fetched successfully',
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
        $taxes = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Sale taxes fetched successfully',
            'pagination' => [
                'current_page' => $taxes->currentPage(),
                'per_page' => $taxes->perPage(),
                'total_items' => $taxes->total(),
                'total_pages' => $taxes->lastPage(),
                'data' => $taxes->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created sale tax
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sale_id'     => 'required|exists:sales,id',
            'tax_rate_id' => 'required|exists:tax_rates,id',
            'amount'      => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $saleTax = SaleTax::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Sale tax created successfully',
            'data' => $saleTax->load(['sale', 'taxRate']),
        ], 201);
    }

    /**
     * 👁️ Show details of a specific sale tax
     */
    public function show($id)
    {
        $saleTax = SaleTax::with(['sale', 'taxRate'])->find($id);

        if (!$saleTax) {
            return response()->json([
                'success' => false,
                'message' => 'Sale tax not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $saleTax,
        ], 200);
    }

    /**
     * ✏️ Update an existing sale tax
     */
    public function update(Request $request, $id)
    {
        $saleTax = SaleTax::find($id);

        if (!$saleTax) {
            return response()->json([
                'success' => false,
                'message' => 'Sale tax not found',
            ], 404);
        }

        $data = $request->validate([
            'sale_id'     => 'sometimes|exists:sales,id',
            'tax_rate_id' => 'sometimes|exists:tax_rates,id',
            'amount'      => 'sometimes|numeric|min:0',
        ]);

        $saleTax->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Sale tax updated successfully',
            'data' => $saleTax->load(['sale', 'taxRate']),
        ], 200);
    }

    /**
     * ❌ Delete a sale tax
     */
    public function destroy($id)
    {
        $saleTax = SaleTax::find($id);

        if (!$saleTax) {
            return response()->json([
                'success' => false,
                'message' => 'Sale tax not found',
            ], 404);
        }

        $saleTax->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sale tax deleted successfully',
        ], 200);
    }
}
