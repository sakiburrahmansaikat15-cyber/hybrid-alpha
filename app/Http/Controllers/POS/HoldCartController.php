<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\HoldCart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HoldCartController extends Controller
{
    /**
     * 📋 Display a listing of the hold carts with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = HoldCart::with('terminal');

        // 🔍 Apply search filter (search by terminal name or ID)
        if ($keyword) {
            $query->where('id', 'like', "%{$keyword}%")
                  ->orWhereHas('terminal', function ($q) use ($keyword) {
                      $q->where('name', 'like', "%{$keyword}%");
                  });
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Hold carts fetched successfully',
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
        $carts = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Hold carts fetched successfully',
            'pagination' => [
                'current_page' => $carts->currentPage(),
                'per_page' => $carts->perPage(),
                'total_items' => $carts->total(),
                'total_pages' => $carts->lastPage(),
                'data' => $carts->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created hold cart
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'terminal_id' => 'required|exists:pos_terminals,id',
            'cart_data'   => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Convert cart_data array to JSON
        if (isset($data['cart_data'])) {
            $data['cart_data'] = json_encode($data['cart_data']);
        }

        $cart = HoldCart::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Hold cart created successfully',
            'data'    => $cart->load('terminal'),
        ], 201);
    }

    /**
     * 👁️ Show details of a specific hold cart
     */
    public function show($id)
    {
        $cart = HoldCart::with('terminal')->find($id);

        if (!$cart) {
            return response()->json([
                'success' => false,
                'message' => 'Hold cart not found',
            ], 404);
        }

        // Decode cart data JSON
        $cart->cart_data = json_decode($cart->cart_data, true);

        return response()->json([
            'success' => true,
            'data' => $cart,
        ], 200);
    }

    /**
     * ✏️ Update an existing hold cart
     */
    public function update(Request $request, $id)
    {
        $cart = HoldCart::find($id);

        if (!$cart) {
            return response()->json([
                'success' => false,
                'message' => 'Hold cart not found',
            ], 404);
        }

        $data = $request->validate([
            'terminal_id' => 'sometimes|exists:pos_terminals,id',
            'cart_data'   => 'nullable',
        ]);

        if (isset($data['cart_data'])) {
            $data['cart_data'] = json_encode($data['cart_data']);
        }

        $cart->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Hold cart updated successfully',
            'data' => $cart->load('terminal'),
        ], 200);
    }

    /**
     * ❌ Delete a hold cart
     */
    public function destroy($id)
    {
        $cart = HoldCart::find($id);

        if (!$cart) {
            return response()->json([
                'success' => false,
                'message' => 'Hold cart not found',
            ], 404);
        }

        $cart->delete();

        return response()->json([
            'success' => true,
            'message' => 'Hold cart deleted successfully',
        ], 200);
    }
}
