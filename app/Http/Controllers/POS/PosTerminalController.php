<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\PosTerminal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PosTerminalController extends Controller
{
    /**
     * 📋 Display a listing of the POS terminals with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = PosTerminal::query();

        // 🔍 Apply search filter (by name or location)
        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('location', 'like', "%{$keyword}%");
            });
        }

        // ⚙️ If no limit provided, return all results
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'POS terminals fetched successfully',
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
        $terminals = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'POS terminals fetched successfully',
            'pagination' => [
                'current_page' => $terminals->currentPage(),
                'per_page' => $terminals->perPage(),
                'total_items' => $terminals->total(),
                'total_pages' => $terminals->lastPage(),
                'data' => $terminals->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created POS terminal
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'       => 'required|string|max:255|unique:pos_terminals,name',
            'location'   => 'nullable|string|max:255',
            'status'     => 'required|in:active,inactive',
            'last_sync_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $terminal = PosTerminal::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'POS terminal created successfully',
            'data'    => $terminal,
        ], 201);
    }

    /**
     * 👁️ Show details of a specific POS terminal
     */
    public function show($id)
    {
        $terminal = PosTerminal::find($id);

        if (!$terminal) {
            return response()->json([
                'success' => false,
                'message' => 'POS terminal not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $terminal,
        ], 200);
    }

    /**
     * ✏️ Update an existing POS terminal
     */
    public function update(Request $request, $id)
    {
        $terminal = PosTerminal::find($id);

        if (!$terminal) {
            return response()->json([
                'success' => false,
                'message' => 'POS terminal not found',
            ], 404);
        }

        $data = $request->validate([
            'name'         => 'sometimes|string|max:255|unique:pos_terminals,name,' . $terminal->id,
            'location'     => 'nullable|string|max:255',
            'status'       => 'sometimes|in:active,inactive',
            'last_sync_at' => 'nullable|date',
        ]);

        $terminal->update($data);

        return response()->json([
            'success' => true,
            'message' => 'POS terminal updated successfully',
            'data' => $terminal,
        ], 200);
    }

    /**
     * ❌ Delete a POS terminal
     */
    public function destroy($id)
    {
        $terminal = PosTerminal::find($id);

        if (!$terminal) {
            return response()->json([
                'success' => false,
                'message' => 'POS terminal not found',
            ], 404);
        }

        $terminal->delete();

        return response()->json([
            'success' => true,
            'message' => 'POS terminal deleted successfully',
        ], 200);
    }
}
