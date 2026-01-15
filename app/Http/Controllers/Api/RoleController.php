<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:roles.view')->only(['index', 'show']);
        $this->middleware('permission:roles.create')->only(['store']);
        $this->middleware('permission:roles.edit')->only(['update']);
        $this->middleware('permission:roles.delete')->only(['destroy']);
    }
    public function index(Request $request)
    {
        $query = Role::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $limit = $request->input('limit', 10);
        $roles = $query->paginate($limit);

        return response()->json($roles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'nullable|array',
            'accesses' => 'nullable|array',
            'status' => 'boolean',
        ]);

        $role = Role::create($validated);

        AuditLog::log('created', 'roles', $role->id, ['name' => $role->name]);

        return response()->json($role, 201);
    }

    public function show($id)
    {
        $role = Role::findOrFail($id);
        return response()->json($role);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:roles,name,' . $id,
            'permissions' => 'nullable|array',
            'accesses' => 'nullable|array',
            'status' => 'boolean',
        ]);

        $role->update($validated);

        AuditLog::log('updated', 'roles', $role->id, $validated);

        return response()->json($role);
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);

        // Prevent deleting if assigned to users - optional check

        $role->delete();

        AuditLog::log('deleted', 'roles', $id, ['name' => $role->name]);

        return response()->json(['message' => 'Role deleted successfully.']);
    }
}
