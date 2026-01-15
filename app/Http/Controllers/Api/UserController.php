<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\Api\StoreUserRequest;
use App\Http\Requests\Api\UpdateUserRequest;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:users.view')->only(['index', 'show']);
        $this->middleware('permission:users.create')->only(['store']);
        $this->middleware('permission:users.edit')->only(['update']);
        $this->middleware('permission:users.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = User::with('role');

        if ($request->filled('keyword')) {
            $keyword = $request->input('keyword');
            $query->where('name', 'like', "%{$keyword}%")
                ->orWhere('email', 'like', "%{$keyword}%");
        }

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        $limit = $request->input('limit', 10);
        $users = $query->paginate($limit);

        return response()->json($users); // Laravel automatically wraps pagination
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        AuditLog::log('created', 'users', $user->id, ['name' => $user->name, 'email' => $user->email]);

        return response()->json($user, 201);
    }

    public function show($id)
    {
        $user = User::with('role')->findOrFail($id);
        return response()->json($user);
    }

    public function update(UpdateUserRequest $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validated();

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        // Remove password from sensitive log
        unset($validated['password']);
        AuditLog::log('updated', 'users', $user->id, $validated);

        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        AuditLog::log('deleted', 'users', $id, ['email' => $user->email]);

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
