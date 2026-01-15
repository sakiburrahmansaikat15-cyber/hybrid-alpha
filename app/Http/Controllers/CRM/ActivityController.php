<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ActivityController extends Controller
{
    /**
     * Display a listing of activities.
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Activity::query();

        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('type', 'like', "%$keyword%")
                    ->orWhere('description', 'like', "%$keyword%");
            });
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Activities fetched successfully',
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
        $activities = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Activities fetched successfully',
            'pagination' => [
                'current_page' => $activities->currentPage(),
                'per_page' => $activities->perPage(),
                'total_items' => $activities->total(),
                'total_pages' => $activities->lastPage(),
                'data' => $activities->items(),
            ],
        ]);
    }

    /**
     * Store a newly created activity.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:call,meeting,task,note',
            'description' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $activity = Activity::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Activity created successfully',
            'data' => $activity
        ], 201);
    }

    /**
     * Display the specified activity.
     */
    public function show($id)
    {
        $activity = Activity::find($id);

        if (!$activity) {
            return response()->json([
                'success' => false,
                'message' => 'Activity not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $activity
        ], 200);
    }

    /**
     * Update the specified activity.
     */
    public function update(Request $request, $id)
    {
        $activity = Activity::findOrFail($id);

        $data = $request->validate([
            'type' => 'sometimes|in:call,meeting,task,note',

            'description' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
        ]);

        $activity->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Activity updated successfully',
            'data' => $activity
        ], 200);
    }

    /**
     * Remove the specified activity.
     */
    public function destroy($id)
    {
        $activity = Activity::find($id);

        if (!$activity) {
            return response()->json([
                'success' => false,
                'message' => 'Activity not found'
            ], 404);
        }

        $activity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Activity deleted successfully'
        ], 200);
    }
}
