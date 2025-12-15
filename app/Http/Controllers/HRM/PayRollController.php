<?php

namespace App\Http\Controllers\HRM;

use App\Http\Controllers\Controller;
use App\Models\HRM\PayRoll;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PayRollController extends Controller
{
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = PayRoll::with('employee');

           if ($keyword) {
        $query->where(function ($q) use ($keyword) {
            $q->where('month', $keyword)
              ->orWhere('year', $keyword);
        });
    }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Payrolls fetched successfully',
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
        $payrolls = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Payrolls fetched successfully',
            'pagination' => [
                'current_page' => $payrolls->currentPage(),
                'per_page' => $payrolls->perPage(),
                'total_items' => $payrolls->total(),
                'total_pages' => $payrolls->lastPage(),
                'data' => $payrolls->items(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id'      => 'required|exists:employees,id',
            'month'            => 'required|integer|min:1|max:12',
            'year'             => 'required|integer|min:2000',
            'basic_salary'     => 'required|numeric|min:0',
            'total_allowance'  => 'nullable|numeric|min:0',
            'total_deduction'  => 'nullable|numeric|min:0',
            'net_salary'       => 'required|numeric|min:0',
            'status'           => 'nullable|in:pending,paid,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $payroll = PayRoll::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Payroll created successfully',
            'data' => $payroll
        ], 201);
    }

    public function show($id)
    {
        $payroll = PayRoll::find($id);

        if (!$payroll) {
            return response()->json([
                'success' => false,
                'message' => 'Payroll not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $payroll
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $payroll = PayRoll::findOrFail($id);

        $data = $request->validate([
            'employee_id'      => 'sometimes|exists:employees,id',
            'month'            => 'sometimes|integer|min:1|max:12',
            'year'             => 'sometimes|integer|min:2000',
            'basic_salary'     => 'sometimes|numeric|min:0',
            'total_allowance'  => 'nullable|numeric|min:0',
            'total_deduction'  => 'nullable|numeric|min:0',
            'net_salary'       => 'sometimes|numeric|min:0',
            'status'           => 'sometimes|in:pending,paid,rejected',
        ]);

        $payroll->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Payroll updated successfully',
            'data' => $payroll
        ], 200);
    }

    public function destroy($id)
    {
        $payroll = PayRoll::find($id);

        if (!$payroll) {
            return response()->json([
                'success' => false,
                'message' => 'Payroll not found'
            ], 404);
        }

        $payroll->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payroll deleted successfully'
        ], 200);
    }
}
