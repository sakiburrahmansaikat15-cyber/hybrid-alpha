<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,name,role_id')->latest();

        if ($request->has('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('action', 'like', "%{$keyword}%")
                    ->orWhere('module', 'like', "%{$keyword}%")
                    ->orWhereHas('user', function ($u) use ($keyword) {
                        $u->where('name', 'like', "%{$keyword}%");
                    });
            });
        }

        if ($request->has('module')) {
            $query->where('module', $request->module);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Date range filtering
        if ($request->has('date_from') && $request->has('date_to')) {
            $query->whereBetween('created_at', [$request->date_from, $request->date_to]);
        }


        $logs = $query->paginate($request->limit ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    }
}
