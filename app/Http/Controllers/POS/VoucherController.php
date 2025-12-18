<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VoucherController extends Controller
{
    /**
     * 📋 Display a listing of the vouchers with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Voucher::query();

        // 🔍 Apply search filter
        if ($keyword) {
            $query->where('code', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Vouchers fetched successfully',
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
        $vouchers = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Vouchers fetched successfully',
            'pagination' => [
                'current_page' => $vouchers->currentPage(),
                'per_page' => $vouchers->perPage(),
                'total_items' => $vouchers->total(),
                'total_pages' => $vouchers->lastPage(),
                'data' => $vouchers->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created voucher
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code'           => 'required|string|max:255|unique:vouchers,code',
            'discount_type'  => 'required|in:percentage,fixed',
            'value'          => 'required|numeric|min:0',
            'expiry_date'    => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $voucher = Voucher::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Voucher created successfully',
            'data' => $voucher,
        ], 201);
    }

    /**
     * 👁️ Show details of a specific voucher
     */
    public function show($id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Voucher not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $voucher,
        ], 200);
    }

    /**
     * ✏️ Update an existing voucher
     */
    public function update(Request $request, $id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Voucher not found',
            ], 404);
        }

        $data = $request->validate([
            'code'           => 'sometimes|string|max:255|unique:vouchers,code,' . $voucher->id,
            'discount_type'  => 'sometimes|in:percentage,fixed',
            'value'          => 'sometimes|numeric|min:0',
            'expiry_date'    => 'nullable|date',
        ]);

        $voucher->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Voucher updated successfully',
            'data' => $voucher,
        ], 200);
    }

    /**
     * ❌ Delete a voucher
     */
    public function destroy($id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Voucher not found',
            ], 404);
        }

        $voucher->delete();

        return response()->json([
            'success' => true,
            'message' => 'Voucher deleted successfully',
        ], 200);
    }
}
