<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomersController extends Controller
{
    /**
     * 📋 Display a listing of the customers with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Customer::with('customergroup'); 

       
        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('phone', 'like', "%{$keyword}%")
                  ->orWhere('email', 'like', "%{$keyword}%");
            });
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Customers fetched successfully',
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
        $customers = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Customers fetched successfully',
            'pagination' => [
                'current_page' => $customers->currentPage(),
                'per_page' => $customers->perPage(),
                'total_items' => $customers->total(),
                'total_pages' => $customers->lastPage(),
                'data' => $customers->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created customer
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'              => 'required|string|max:255',
            'phone'             => 'required|string|max:20|unique:pos_customers,phone',
            'email'             => 'nullable|email|max:255',
            'customer_group_id' => 'nullable|exists:customer_groups,id',
            'loyalty_points'    => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $customer = Customer::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully',
            'data'    => $customer->load('customergroup'),
        ], 201);
    }

    /**
     * 👁️ Show details of a specific customer
     */
    public function show($id)
    {
        $customer = Customer::with(['customergroup', 'addresses'])->find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $customer,
        ], 200);
    }

    /**
     * ✏️ Update an existing customer
     */
    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $data = $request->validate([
            'name'              => 'sometimes|string|max:255',
            'phone'             => 'sometimes|string|max:20|unique:pos_customers,phone,' . $customer->id,
            'email'             => 'nullable|email|max:255',
            'customer_group_id' => 'nullable|exists:customer_groups,id',
            'loyalty_points'    => 'nullable|integer|min:0',
        ]);

        $customer->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => $customer->load('customergroup'),
        ], 200);
    }

    /**
     * ❌ Delete a customer
     */
    public function destroy($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully',
        ], 200);
    }
}
