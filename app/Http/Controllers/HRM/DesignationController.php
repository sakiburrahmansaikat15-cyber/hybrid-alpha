<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Http\Resources\DesignationResource;
use App\Models\HRM\Designation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DesignationController extends Controller
{
    // GET /designations
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Designation::with('department');

        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Designations fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => DesignationResource::collection($data),
                ],
            ]);
        }

        $limit = (int) $limit ?: 10;
        $designations = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Designations fetched successfully',
            'pagination' => [
                'current_page' => $designations->currentPage(),
                'per_page' => $designations->perPage(),
                'total_items' => $designations->total(),
                'total_pages' => $designations->lastPage(),
                'data' => DesignationResource::collection($designations),
            ],
        ]);
    }

    // POST /designations
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $designation = Designation::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Designation created successfully',
            'data' => new DesignationResource($designation)
        ], 201);
    }

    // GET /designations/{id}
    public function show($id)
    {
        $designation = Designation::with('department')->find($id);

        if (!$designation) {
            return response()->json([
                'success' => false,
                'message' => 'Designation not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new DesignationResource($designation)
        ], 200);
    }

    // PUT /designations/{id}
    public function update(Request $request, $id)
    {
        $designation = Designation::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'department_id' => 'sometimes|exists:departments,id',
        ]);

        $designation->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Designation updated successfully',
            'data' => new DesignationResource($designation)
        ], 200);
    }

    // DELETE /designations/{id}
    public function destroy($id)
    {
        $designation = Designation::find($id);

        if (!$designation) {
            return response()->json([
                'success' => false,
                'message' => 'Designation not found'
            ], 404);
        }

        $designation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Designation deleted successfully'
        ], 200);
    }
}
