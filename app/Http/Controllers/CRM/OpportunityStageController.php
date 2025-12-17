<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\OpportunityStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OpportunityStageController extends Controller
{
    /**
     * Display a listing of the opportunity stages.
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = OpportunityStage::query();

        if ($keyword) {
            $query->where('name', 'like', "%$keyword%")
                  ->orWhere('probability', 'like', "%$keyword%")
                  ->orWhere('order', 'like', "%$keyword%");
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Opportunity stages fetched successfully',
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
        $stages = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Opportunity stages fetched successfully',
            'pagination' => [
                'current_page' => $stages->currentPage(),
                'per_page' => $stages->perPage(),
                'total_items' => $stages->total(),
                'total_pages' => $stages->lastPage(),
                'data' => $stages->items(),
            ],
        ]);
    }

    /**
     * Store a newly created opportunity stage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:255',
            'probability' => 'nullable|integer|min:0|max:100',
            'order'       => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $stage = OpportunityStage::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Opportunity stage created successfully',
            'data' => $stage
        ], 201);
    }

    /**
     * Display the specified opportunity stage.
     */
    public function show($id)
    {
        $stage = OpportunityStage::with('opportunities')->find($id);

        if (!$stage) {
            return response()->json([
                'success' => false,
                'message' => 'Opportunity stage not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $stage
        ], 200);
    }

    /**
     * Update the specified opportunity stage.
     */
    public function update(Request $request, $id)
    {
        $stage = OpportunityStage::findOrFail($id);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'probability' => 'nullable|integer|min:0|max:100',
            'order'       => 'nullable|integer|min:0',
        ]);

        $stage->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity stage updated successfully',
            'data' => $stage
        ], 200);
    }

    /**
     * Remove the specified opportunity stage.
     */
    public function destroy($id)
    {
        $stage = OpportunityStage::find($id);

        if (!$stage) {
            return response()->json([
                'success' => false,
                'message' => 'Opportunity stage not found'
            ], 404);
        }

        $stage->delete();

        return response()->json([
            'success' => true,
            'message' => 'Opportunity stage deleted successfully'
        ], 200);
    }
}
