<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompanyController extends Controller
{
    /**
     * Display a listing of the companies.
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = Company::query();

        if ($keyword) {
            $query->where('name', 'like', "%$keyword%")
                  ->orWhere('industry', 'like', "%$keyword%")
                  ->orWhere('address', 'like', "%$keyword%");
        }

        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Companies fetched successfully',
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
        $companies = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Companies fetched successfully',
            'pagination' => [
                'current_page' => $companies->currentPage(),
                'per_page' => $companies->perPage(),
                'total_items' => $companies->total(),
                'total_pages' => $companies->lastPage(),
                'data' => $companies->items(),
            ],
        ]);
    }

    /**
     * Store a newly created company.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'industry' => 'nullable|string|max:255',
            'website'  => 'nullable|string|max:255',
            'address'  => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $company = Company::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Company created successfully',
            'data' => $company
        ], 201);
    }

    /**
     * Display the specified company.
     */
    public function show($id)
    {
        $company = Company::with('customers')->find($id);

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Company not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $company
        ], 200);
    }

    /**
     * Update the specified company.
     */
    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'industry' => 'nullable|string|max:255',
            'website'  => 'nullable|string|max:255',
            'address'  => 'nullable|string',
        ]);

        $company->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Company updated successfully',
            'data' => $company
        ], 200);
    }

    /**
     * Remove the specified company.
     */
    public function destroy($id)
    {
        $company = Company::find($id);

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Company not found'
            ], 404);
        }

        $company->delete();

        return response()->json([
            'success' => true,
            'message' => 'Company deleted successfully'
        ], 200);
    }
}
