<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\TaxGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaxGroupController extends Controller
{
    /**
     * 📋 Display a listing of the tax groups with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = TaxGroup::query();

        // 🔍 Apply search filter
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Tax groups fetched successfully',
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
            'message' => 'Tax groups fetched successfully',
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
     * ➕ Store a newly created tax group
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:tax_groups,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $taxGroup = TaxGroup::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Tax group created successfully',
            'data' => $taxGroup,
        ], 201);
    }

    /**
     * 👁️ Show details of a specific tax group
     */
    public function show($id)
    {
        $taxGroup = TaxGroup::find($id);

        if (!$taxGroup) {
            return response()->json([
                'success' => false,
                'message' => 'Tax group not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $taxGroup,
        ], 200);
    }

    /**
     * ✏️ Update an existing tax group
     */
    public function update(Request $request, $id)
    {
        $taxGroup = TaxGroup::find($id);

        if (!$taxGroup) {
            return response()->json([
                'success' => false,
                'message' => 'Tax group not found',
            ], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255|unique:tax_groups,name,' . $taxGroup->id,
        ]);

        $taxGroup->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Tax group updated successfully',
            'data' => $taxGroup,
        ], 200);
    }

    /**
     * ❌ Delete a tax group
     */
    public function destroy($id)
    {
        $taxGroup = TaxGroup::find($id);

        if (!$taxGroup) {
            return response()->json([
                'success' => false,
                'message' => 'Tax group not found',
            ], 404);
        }

        $taxGroup->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tax group deleted successfully',
        ], 200);
    }
}
