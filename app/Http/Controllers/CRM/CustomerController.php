<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    /**
     * Display a listing of the customers.
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Customer::with(['company']);

        if ($keyword) {
            $query->where('name', 'like', "%$keyword%")
                  ->orWhere('email', 'like', "%$keyword%")
                  ->orWhere('phone', 'like', "%$keyword%");
        }

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
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'       => 'required|string|max:255',
            'email'      => 'nullable|email|max:255',
            'phone'      => 'nullable|string|max:50',
            'company_id' => 'nullable|exists:companies,id',
            'type'       => 'required|in:individual,business',
            'status'     => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $customer = Customer::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully',
            'data' => $customer
        ], 201);
    }

    /**
     * Display the specified customer.
     */
    public function show($id)
    {
        $customer = Customer::with(['company', 'contacts', 'opportunities', 'tickets'])->find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $customer
        ], 200);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $data = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'email'      => 'nullable|email|max:255',
            'phone'      => 'nullable|string|max:50',
            'company_id' => 'sometimes|exists:companies,id',
            'type'       => 'sometimes|in:individual,business',
            'status'     => 'boolean',
        ]);

        $customer->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => $customer
        ], 200);
    }

    /**
     * Remove the specified customer.
     */
    public function destroy($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found'
            ], 404);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully'
        ], 200);
    }
}
