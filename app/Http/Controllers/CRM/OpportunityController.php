<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\Opportunity;
use App\Http\Resources\OpportunityResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OpportunityController extends Controller
{
    /**
     * Display a listing of the opportunities.
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Opportunity::with(['customer', 'stage']);

        if ($keyword) {
            $query->whereHas('customer', function ($q) use ($keyword) {
                $q->where('name', 'like', "%$keyword%");
            })->orWhere('amount', 'like', "%$keyword%")
                ->orWhere('name', 'like', "%$keyword%")
                ->orWhere('probability', 'like', "%$keyword%");
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Opportunities fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => OpportunityResource::collection($data),
                ],
            ]);
        }

        $limit = (int) $limit ?: 10;
        $opportunities = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Opportunities fetched successfully',
            'pagination' => [
                'current_page' => $opportunities->currentPage(),
                'per_page' => $opportunities->perPage(),
                'total_items' => $opportunities->total(),
                'total_pages' => $opportunities->lastPage(),
                'data' => OpportunityResource::collection($opportunities),
            ],
        ]);
    }

    /**
     * Store a newly created opportunity.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'opportunity_stage_id' => 'required|exists:opportunity_stages,id',
            'amount' => 'nullable|numeric|min:0',
            'probability' => 'nullable|integer|min:0|max:100',
            'expected_close_date' => 'nullable|date',
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $opportunity = Opportunity::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Opportunity created successfully',
            'data' => new OpportunityResource($opportunity->load(['customer', 'stage']))
        ], 201);
    }

    /**
     * Display the specified opportunity.
     */
    public function show($id)
    {
        $opportunity = Opportunity::with(['customer', 'stage'])->find($id);

        if (!$opportunity) {
            return response()->json([
                'success' => false,
                'message' => 'Opportunity not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new OpportunityResource($opportunity)
        ], 200);
    }

    /**
     * Update the specified opportunity.
     */
    public function update(Request $request, $id)
    {
        $opportunity = Opportunity::findOrFail($id);

        $data = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'opportunity_stage_id' => 'sometimes|exists:opportunity_stages,id',
            'amount' => 'nullable|numeric|min:0',
            'probability' => 'nullable|integer|min:0|max:100',
            'expected_close_date' => 'nullable|date',
            'name' => 'sometimes|string|max:255',
        ]);

        $opportunity->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity updated successfully',
            'data' => new OpportunityResource($opportunity->load(['customer', 'stage']))
        ], 200);
    }

    /**
     * Remove the specified opportunity.
     */
    public function destroy($id)
    {
        $opportunity = Opportunity::find($id);

        if (!$opportunity) {
            return response()->json([
                'success' => false,
                'message' => 'Opportunity not found'
            ], 404);
        }

        $opportunity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Opportunity deleted successfully'
        ], 200);
    }
}
