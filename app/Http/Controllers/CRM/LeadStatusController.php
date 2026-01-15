<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\LeadStatus;
use App\Http\Resources\LeadStatusResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeadStatusController extends Controller
{
    /**
     * Display a listing of lead statuses.
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = LeadStatus::withCount('leads');

        if ($keyword) {
            $query->where('name', 'like', "%$keyword%")
                ->orWhere('color_code', 'like', "%$keyword%");
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Lead statuses fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => LeadStatusResource::collection($data),
                ],
            ]);
        }

        $limit = (int) $limit ?: 10;
        $statuses = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Lead statuses fetched successfully',
            'pagination' => [
                'current_page' => $statuses->currentPage(),
                'per_page' => $statuses->perPage(),
                'total_items' => $statuses->total(),
                'total_pages' => $statuses->lastPage(),
                'data' => LeadStatusResource::collection($statuses),
            ],
        ]);
    }

    /**
     * Store a newly created lead status.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'color_code' => 'nullable|string|max:50',
            'order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $status = LeadStatus::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Lead status created successfully',
            'data' => new LeadStatusResource($status->loadCount('leads'))
        ], 201);
    }

    /**
     * Display the specified lead status.
     */
    public function show($id)
    {
        $status = LeadStatus::with('leads')->find($id);

        if (!$status) {
            return response()->json([
                'success' => false,
                'message' => 'Lead status not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new LeadStatusResource($status->loadCount('leads'))
        ], 200);
    }

    /**
     * Update the specified lead status.
     */
    public function update(Request $request, $id)
    {
        $status = LeadStatus::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'color_code' => 'nullable|string|max:50',
            'order' => 'nullable|integer|min:0',
        ]);

        $status->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Lead status updated successfully',
            'data' => new LeadStatusResource($status->loadCount('leads'))
        ], 200);
    }

    /**
     * Remove the specified lead status.
     */
    public function destroy($id)
    {
        $status = LeadStatus::find($id);

        if (!$status) {
            return response()->json([
                'success' => false,
                'message' => 'Lead status not found'
            ], 404);
        }

        $status->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lead status deleted successfully'
        ], 200);
    }
}
