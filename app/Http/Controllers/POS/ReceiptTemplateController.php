<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\ReceiptTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReceiptTemplateController extends Controller
{
    /**
     * 📋 Display a listing of the receipt templates with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = ReceiptTemplate::query();

        // 🔍 Apply search filter
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Receipt templates fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => $data,
                ],
            ]);
        }

        // 📄 Paginate results
        $limit = (int) $limit ?: 10;
        $templates = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Receipt templates fetched successfully',
            'pagination' => [
                'current_page' => $templates->currentPage(),
                'per_page' => $templates->perPage(),
                'total_items' => $templates->total(),
                'total_pages' => $templates->lastPage(),
                'data' => $templates->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created receipt template
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'   => 'required|string|max:255|unique:receipt_templates,name',
            'layout' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $template = ReceiptTemplate::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Receipt template created successfully',
            'data'    => $template,
        ], 201);
    }

    /**
     * 👁️ Show details of a specific receipt template
     */
    public function show($id)
    {
        $template = ReceiptTemplate::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Receipt template not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $template,
        ], 200);
    }

    /**
     * ✏️ Update an existing receipt template
     */
    public function update(Request $request, $id)
    {
        $template = ReceiptTemplate::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Receipt template not found',
            ], 404);
        }

        $data = $request->validate([
            'name'   => 'sometimes|string|max:255|unique:receipt_templates,name,' . $template->id,
            'layout' => 'sometimes|string',
        ]);

        $template->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Receipt template updated successfully',
            'data' => $template,
        ], 200);
    }

    /**
     * ❌ Delete a receipt template
     */
    public function destroy($id)
    {
        $template = ReceiptTemplate::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Receipt template not found',
            ], 404);
        }

        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Receipt template deleted successfully',
        ], 200);
    }
}
