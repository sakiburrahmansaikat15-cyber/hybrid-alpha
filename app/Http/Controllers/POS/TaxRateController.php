<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\TaxRate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaxRateController extends Controller
{
    /**
     * 📋 Display a listing of the tax rates with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = TaxRate::query();

        // 🔍 Apply search filter
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Tax rates fetched successfully',
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
        $rates = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Tax rates fetched successfully',
            'pagination' => [
                'current_page' => $rates->currentPage(),
                'per_page' => $rates->perPage(),
                'total_items' => $rates->total(),
                'total_pages' => $rates->lastPage(),
                'data' => $rates->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created tax rate
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:tax_rates,name',
            'rate' => 'required|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $taxRate = TaxRate::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Tax rate created successfully',
            'data' => $taxRate,
        ], 201);
    }

    /**
     * 👁️ Show details of a specific tax rate
     */
    public function show($id)
    {
        $taxRate = TaxRate::find($id);

        if (!$taxRate) {
            return response()->json([
                'success' => false,
                'message' => 'Tax rate not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $taxRate,
        ], 200);
    }

    /**
     * ✏️ Update an existing tax rate
     */
    public function update(Request $request, $id)
    {
        $taxRate = TaxRate::find($id);

        if (!$taxRate) {
            return response()->json([
                'success' => false,
                'message' => 'Tax rate not found',
            ], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255|unique:tax_rates,name,' . $taxRate->id,
            'rate' => 'sometimes|numeric|min:0|max:100',
        ]);

        $taxRate->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Tax rate updated successfully',
            'data' => $taxRate,
        ], 200);
    }

    /**
     * ❌ Delete a tax rate
     */
    public function destroy($id)
    {
        $taxRate = TaxRate::find($id);

        if (!$taxRate) {
            return response()->json([
                'success' => false,
                'message' => 'Tax rate not found',
            ], 404);
        }

        $taxRate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tax rate deleted successfully',
        ], 200);
    }
}
