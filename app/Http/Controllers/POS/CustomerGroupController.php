<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\CustomerGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerGroupController extends Controller
{
    /**
     * 📋 Display a listing of the customer groups with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = CustomerGroup::query();

        // 🔍 Apply search filter
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Customer groups fetched successfully',
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
        $groups = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Customer groups fetched successfully',
            'pagination' => [
                'current_page' => $groups->currentPage(),
                'per_page' => $groups->perPage(),
                'total_items' => $groups->total(),
                'total_pages' => $groups->lastPage(),
                'data' => $groups->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created customer group
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'          => 'required|string|max:255|unique:customer_groups,name',
            'pricing_type'  => 'required|in:fixed,percentage,none',
            'discount_rate' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $group = CustomerGroup::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Customer group created successfully',
            'data'    => $group,
        ], 201);
    }

    /**
     * 👁️ Show details of a specific customer group
     */
    public function show($id)
    {
        $group = CustomerGroup::find($id);

        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Customer group not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $group,
        ], 200);
    }

    /**
     * ✏️ Update an existing customer group
     */
    public function update(Request $request, $id)
    {
        $group = CustomerGroup::find($id);

        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Customer group not found',
            ], 404);
        }

        $data = $request->validate([
            'name'          => 'sometimes|string|max:255|unique:customer_groups,name,' . $group->id,
            'pricing_type'  => 'sometimes|in:fixed,percentage,none',
            'discount_rate' => 'sometimes|numeric|min:0',
        ]);

        $group->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Customer group updated successfully',
            'data' => $group,
        ], 200);
    }

    /**
     * ❌ Delete a customer group
     */
    public function destroy($id)
    {
        $group = CustomerGroup::find($id);

        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Customer group not found',
            ], 404);
        }

        $group->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer group deleted successfully',
        ], 200);
    }
}
