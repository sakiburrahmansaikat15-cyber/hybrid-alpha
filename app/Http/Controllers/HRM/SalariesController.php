<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\Salary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SalariesController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Salary::with('employee');

        if ($keyword) {
            $query->whereDate('effective_from', $keyword);
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Salaries fetched successfully',
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
        $salaries = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Salaries fetched successfully',
            'pagination' => [
                'current_page' => $salaries->currentPage(),
                'per_page' => $salaries->perPage(),
                'total_items' => $salaries->total(),
                'total_pages' => $salaries->lastPage(),
                'data' => $salaries->items(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id'    => 'required|exists:employees,id',
            'basic_salary'   => 'required|numeric|min:0',
            'allowances'     => 'nullable|string',
            'deductions'     => 'nullable|string',
            'effective_from' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $salary = Salary::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Salary created successfully',
            'data' => $salary
        ], 201);
    }

    public function show($id)
    {
        $salary = Salary::find($id);

        if (!$salary) {
            return response()->json([
                'success' => false,
                'message' => 'Salary not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $salary
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $salary = Salary::findOrFail($id);

        $data = $request->validate([
            'employee_id'    => 'sometimes|exists:employees,id',
            'basic_salary'   => 'sometimes|numeric|min:0',
            'allowances'     => 'nullable|array',
            'deductions'     => 'nullable|array',
            'effective_from' => 'sometimes|date',
        ]);

        $salary->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Salary updated successfully',
            'data' => $salary
        ], 200);
    }

    public function destroy($id)
    {
        $salary = Salary::find($id);

        if (!$salary) {
            return response()->json([
                'success' => false,
                'message' => 'Salary not found'
            ], 404);
        }

        $salary->delete();

        return response()->json([
            'success' => true,
            'message' => 'Salary deleted successfully'
        ], 200);
    }
}
