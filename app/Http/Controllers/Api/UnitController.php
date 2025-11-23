<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UnitResource;
use App\Models\Unit;
use Illuminate\Http\Request;


class UnitController extends Controller
{
    // List all units
    public function index()
    {
        $units = Unit::get();
        return UnitResource::collection($units);
    }

    // Store a new unit
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
             'status' => 'required|in:active,inactive',
        ]);

        $unit = Unit::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Unit created successfully',
            'data' => new UnitResource($unit)
        ], 201);
    }

    // Show a single unit
    public function show($id)
    {
        $unit = Unit::findOrFail($id);
        return new UnitResource($unit);
    }




     public function update(Request $request, $id)
  {

    $unit = Unit::findOrFail($id);

     if ($request->has('status')) {
        if ($request->status === 'active') $request->merge(['status' => true]);
        if ($request->status === 'inactive') $request->merge(['status' => false]);
        }

    $data = $request->validate([
        'name' => 'sometimes|string|max:255',
        'status' => 'sometimes|boolean',
    ]);

    $unit->update($data);

    return response()->json([
        'success' => true,
        'message' => 'Unit updated successfully',
        'data' => new UnitResource($unit)
    ], 200);
}




    // Delete a unit
    public function destroy($id)
    {
        $unit = Unit::findOrFail($id);
        $unit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Unit deleted successfully'
        ]);
    }
}
