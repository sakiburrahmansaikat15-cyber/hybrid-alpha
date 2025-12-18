<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\CustomerAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerAddressController extends Controller
{
    /**
     * 📋 Display a listing of the customer addresses with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = CustomerAddress::with('customer');

        // 🔍 Apply search filter (search in address, city, or country)
        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('address', 'like', "%{$keyword}%")
                  ->orWhere('city', 'like', "%{$keyword}%")
                  ->orWhere('country', 'like', "%{$keyword}%");
            });
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Customer addresses fetched successfully',
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
        $addresses = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Customer addresses fetched successfully',
            'pagination' => [
                'current_page' => $addresses->currentPage(),
                'per_page' => $addresses->perPage(),
                'total_items' => $addresses->total(),
                'total_pages' => $addresses->lastPage(),
                'data' => $addresses->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created customer address
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:pos_customers,id',
            'address'     => 'required|string',
            'city'        => 'required|string|max:255',
            'country'     => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $address = CustomerAddress::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Customer address created successfully',
            'data'    => $address->load('customer'),
        ], 201);
    }

    /**
     * 👁️ Show details of a specific customer address
     */
    public function show($id)
    {
        $address = CustomerAddress::with('customer')->find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Customer address not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $address,
        ], 200);
    }

    /**
     * ✏️ Update an existing customer address
     */
    public function update(Request $request, $id)
    {
        $address = CustomerAddress::find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Customer address not found',
            ], 404);
        }

        $data = $request->validate([
            'customer_id' => 'sometimes|exists:pos_customers,id',
            'address'     => 'sometimes|string',
            'city'        => 'sometimes|string|max:255',
            'country'     => 'sometimes|string|max:255',
        ]);

        $address->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Customer address updated successfully',
            'data' => $address->load('customer'),
        ], 200);
    }

    /**
     * ❌ Delete a customer address
     */
    public function destroy($id)
    {
        $address = CustomerAddress::find($id);

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Customer address not found',
            ], 404);
        }

        $address->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer address deleted successfully',
        ], 200);
    }
}
