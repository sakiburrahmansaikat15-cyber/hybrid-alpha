<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\LeadSource;
use App\Http\Resources\LeadSourceResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeadSourceController extends Controller
{
    /**
     * Display a listing of lead sources.
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = LeadSource::withCount('leads');

        if ($keyword) {
            $query->where('name', 'like', "%$keyword%")
                ->orWhere('description', 'like', "%$keyword%");
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Lead sources fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => LeadSourceResource::collection($data),
                ],
            ]);
        }

        $limit = (int) $limit ?: 10;
        $sources = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Lead sources fetched successfully',
            'pagination' => [
                'current_page' => $sources->currentPage(),
                'per_page' => $sources->perPage(),
                'total_items' => $sources->total(),
                'total_pages' => $sources->lastPage(),
                'data' => LeadSourceResource::collection($sources),
            ],
        ]);
    }

    /**
     * Store a newly created lead source.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $source = LeadSource::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Lead source created successfully',
            'data' => new LeadSourceResource($source->loadCount('leads'))
        ], 201);
    }

    /**
     * Display the specified lead source.
     */
    public function show($id)
    {
        $source = LeadSource::with('leads')->find($id);

        if (!$source) {
            return response()->json([
                'success' => false,
                'message' => 'Lead source not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new LeadSourceResource($source->loadCount('leads'))
        ], 200);
    }

    /**
     * Update the specified lead source.
     */
    public function update(Request $request, $id)
    {
        $source = LeadSource::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'boolean',
        ]);

        $source->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Lead source updated successfully',
            'data' => new LeadSourceResource($source->loadCount('leads'))
        ], 200);
    }

    /**
     * Remove the specified lead source.
     */
    public function destroy($id)
    {
        $source = LeadSource::find($id);

        if (!$source) {
            return response()->json([
                'success' => false,
                'message' => 'Lead source not found'
            ], 404);
        }

        $source->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lead source deleted successfully'
        ], 200);
    }
}
