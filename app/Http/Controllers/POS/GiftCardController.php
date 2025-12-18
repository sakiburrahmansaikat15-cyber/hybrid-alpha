<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\GiftCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GiftCardController extends Controller
{
    /**
     * 📋 Display a listing of the gift cards with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = GiftCard::query();

        // 🔍 Apply search filter
        if ($keyword) {
            $query->where('code', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Gift cards fetched successfully',
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
        $cards = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Gift cards fetched successfully',
            'pagination' => [
                'current_page' => $cards->currentPage(),
                'per_page' => $cards->perPage(),
                'total_items' => $cards->total(),
                'total_pages' => $cards->lastPage(),
                'data' => $cards->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created gift card
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code'         => 'required|string|max:255|unique:gift_cards,code',
            'balance'      => 'required|numeric|min:0',
            'expiry_date'  => 'nullable|date',
            'status'       => 'required|in:active,inactive,expired',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $giftCard = GiftCard::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Gift card created successfully',
            'data'    => $giftCard,
        ], 201);
    }

    /**
     * 👁️ Show details of a specific gift card
     */
    public function show($id)
    {
        $giftCard = GiftCard::find($id);

        if (!$giftCard) {
            return response()->json([
                'success' => false,
                'message' => 'Gift card not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $giftCard,
        ], 200);
    }

    /**
     * ✏️ Update an existing gift card
     */
    public function update(Request $request, $id)
    {
        $giftCard = GiftCard::find($id);

        if (!$giftCard) {
            return response()->json([
                'success' => false,
                'message' => 'Gift card not found',
            ], 404);
        }

        $data = $request->validate([
            'code'         => 'sometimes|string|max:255|unique:gift_cards,code,' . $giftCard->id,
            'balance'      => 'sometimes|numeric|min:0',
            'expiry_date'  => 'nullable|date',
            'status'       => 'sometimes|in:active,inactive,expired',
        ]);

        $giftCard->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Gift card updated successfully',
            'data' => $giftCard,
        ], 200);
    }

    /**
     * ❌ Delete a gift card
     */
    public function destroy($id)
    {
        $giftCard = GiftCard::find($id);

        if (!$giftCard) {
            return response()->json([
                'success' => false,
                'message' => 'Gift card not found',
            ], 404);
        }

        $giftCard->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gift card deleted successfully',
        ], 200);
    }
}
