<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\PosSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PosSessionController extends Controller
{
    /**
     * 📋 Display a listing of the POS sessions with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = PosSession::with('terminal');

        // 🔍 Apply search filter by terminal name
        if ($keyword) {
            $query->whereHas('terminal', function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%");
            });
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'POS sessions fetched successfully',
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
        $sessions = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'POS sessions fetched successfully',
            'pagination' => [
                'current_page' => $sessions->currentPage(),
                'per_page' => $sessions->perPage(),
                'total_items' => $sessions->total(),
                'total_pages' => $sessions->lastPage(),
                'data' => $sessions->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created POS session
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'terminal_id'  => 'required|exists:pos_terminals,id',
            'opened_at'    => 'required|date',
            'closing_cash' => 'nullable|numeric|min:0',
            'opening_cash' => 'required|numeric|min:0',
            'closed_at'    => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $session = PosSession::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'POS session created successfully',
            'data' => $session->load('terminal'),
        ], 201);
    }

    /**
     * 👁️ Show details of a specific POS session
     */
    public function show($id)
    {
        $session = PosSession::with('terminal')->find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'POS session not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $session,
        ], 200);
    }

    /**
     * ✏️ Update an existing POS session
     */
    public function update(Request $request, $id)
    {
        $session = PosSession::find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'POS session not found',
            ], 404);
        }

        $data = $request->validate([
            'terminal_id'  => 'sometimes|exists:pos_terminals,id',
            'opened_at'    => 'sometimes|date',
            'closed_at'    => 'nullable|date',
            'opening_cash' => 'sometimes|numeric|min:0',
            'closing_cash' => 'nullable|numeric|min:0',
        ]);

        $session->update($data);

        return response()->json([
            'success' => true,
            'message' => 'POS session updated successfully',
            'data' => $session->load('terminal'),
        ], 200);
    }

    /**
     * ❌ Delete a POS session
     */
    public function destroy($id)
    {
        $session = PosSession::find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'POS session not found',
            ], 404);
        }

        $session->delete();

        return response()->json([
            'success' => true,
            'message' => 'POS session deleted successfully',
        ], 200);
    }
}
