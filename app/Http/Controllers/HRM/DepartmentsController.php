<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Http\Resources\DepartmentResource;
use App\Models\HRM\Departments;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DepartmentsController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Departments::query();

        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Departments fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => DepartmentResource::collection($data),
                ],
            ]);
        }

        $limit = (int) $limit ?: 10;
        $departments = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Departments fetched successfully',
            'pagination' => [
                'current_page' => $departments->currentPage(),
                'per_page' => $departments->perPage(),
                'total_items' => $departments->total(),
                'total_pages' => $departments->lastPage(),
                'data' => DepartmentResource::collection($departments),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $department = Departments::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully',
            'data' => new DepartmentResource($department)
        ], 201);
    }

    public function show($id)
    {
        $department = Departments::find($id);

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new DepartmentResource($department)
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $department = Departments::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $department->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully',
            'data' => new DepartmentResource($department)
        ], 200);
    }


    public function destroy($id)
    {
        $department = Departments::find($id);

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully'
        ], 200);
    }
}
