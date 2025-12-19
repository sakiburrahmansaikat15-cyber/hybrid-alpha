<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmployeeResource;
use App\Models\HRM\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    // GET /employees
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Employee::with(['department', 'designation']);

        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('first_name', 'like', "%{$keyword}%")
                  ->orWhere('last_name', 'like', "%{$keyword}%")
                  ->orWhere('employee_code', 'like', "%{$keyword}%");
            });
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Employees fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => EmployeeResource::collection($data),
                ],
            ]);
        }

        $limit = (int) $limit ?: 10;
        $employees = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Employees fetched successfully',
            'pagination' => [
                'current_page' => $employees->currentPage(),
                'per_page' => $employees->perPage(),
                'total_items' => $employees->total(),
                'total_pages' => $employees->lastPage(),
                'data' => EmployeeResource::collection($employees),
            ],
        ]);
    }

    // POST /employees
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_code' => 'required|string',
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'join_date' => 'nullable|date',
            'job_type' => 'nullable|in:permanent,contract,intern',
            'salary_type' => 'nullable|in:monthly,hourly',
            'status' => 'sometimes|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $employee = Employee::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully',
            'data' => new EmployeeResource($employee)
        ], 201);
    }

    // GET /employees/{id}
    public function show($id)
    {
        $employee = Employee::with(['department', 'designation'])->find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new EmployeeResource($employee)
        ], 200);
    }

    // PUT /employees/{id}
    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);

        $data = $request->validate([
            'employee_code' => "sometimes|string|unique:employees,employee_code,{$id}",
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'join_date' => 'nullable|date',
            'job_type' => 'nullable|in:permanent,contract,intern',
            'salary_type' => 'nullable|in:monthly,hourly',
            'status' => 'nullable|in:active,inactive',
        ]);

        $employee->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully',
            'data' => new EmployeeResource($employee)
        ], 200);
    }

    // DELETE /employees/{id}
    public function destroy($id)
    {
        $employee = Employee::find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully'
        ], 200);
    }
}
