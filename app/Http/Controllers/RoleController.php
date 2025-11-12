<?php

namespace App\Http\Controllers;

use App\Http\Resources\RoleResource;
use Illuminate\Http\Request;
use App\Models\Role;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::where('status', 1)->get();
        return response()->json($roles);
        // command
        // php artisan make:resource RoleResource
        return RoleResource::collection($roles);
    }
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'permission' => 'required|array',
            'accesses' => 'required|array',
            'status' => 'boolean'
        ]);

        $role = Role::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Role created successfully',
            'data' => new RoleResource($role)
        ], 201);
    }
    public function show($id)
    {
        $role = Role::findOrFail($id);
        return new RoleResource($role);
    }
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'permission' => 'nullable|array',
            'accesses' => 'nullable|array',
            'status' => 'boolean',
        ]);

        $role->update($data);
        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'data' => new RoleResource($role)
        ], 200);
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();

        return response()->json(['message' => 'Role deleted successfully.']);
    }
}
