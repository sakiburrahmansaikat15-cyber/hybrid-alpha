<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SerialList;
use Illuminate\Http\Request;

class SerialListController extends Controller
{
    // LIST
    public function index()
    {
        return response()->json(
            SerialList::with(['stock', 'warehouse'])->get()
        );
    }

    // CREATE
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'stocks_id'     => 'required|exists:stocks,id',
            'warehouse_id'  => 'required|exists:warehouses,id',
            'sku'           => 'nullable|string',
            'barcode'       => 'nullable|string',
            'color'         => 'nullable|string',
            'notes'         => 'nullable|string',
            'status'        => 'required|boolean',
            'image'         => 'nullable|image|max:2048',
        ]);

        // Image Upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $name = time().'_'.$image->getClientOriginalName();
            $image->move(public_path('serial-list'), $name);
            $validated['image'] = 'serial-list/'.$name;
        }

        $serial = SerialList::create($validated);

        return response()->json($serial, 201);
    }

    // SHOW
    public function show($id)
    {
        return response()->json(
            SerialList::with(['stock', 'warehouse'])->findOrFail($id)
        );
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $serial = SerialList::findOrFail($id);

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'stocks_id'     => 'required|exists:stocks,id',
            'warehouse_id'  => 'required|exists:warehouses,id',
            'sku'           => 'nullable|string',
            'barcode'       => 'nullable|string',
            'color'         => 'nullable|string',
            'notes'         => 'nullable|string',
            'status'        => 'required|boolean',
            'image'         => 'nullable|image|max:2048',
        ]);

        // Replace Image
        if ($request->hasFile('image')) {

            if ($serial->image && file_exists(public_path($serial->image))) {
                unlink(public_path($serial->image));
            }

            $image = $request->file('image');
            $name = time().'_'.$image->getClientOriginalName();
            $image->move(public_path('serial-list'), $name);
            $validated['image'] = 'serial-list/'.$name;
        }

        $serial->update($validated);

        return response()->json($serial);
    }

    // DELETE
    public function destroy($id)
    {
        $serial = SerialList::findOrFail($id);

        if ($serial->image && file_exists(public_path($serial->image))) {
            unlink(public_path($serial->image));
        }

        $serial->delete();

        return response()->json(['message' => 'Deleted Successfully']);
    }

    // SEARCH
    public function search(Request $request)
    {
        $search = $request->search;

        $results = SerialList::where('name', 'like', "%{$search}%")
            ->orWhere('sku', 'like', "%{$search}%")
            ->orWhere('barcode', 'like', "%{$search}%")
            ->orWhere('color', 'like', "%{$search}%")
            ->orWhereHas('stock', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })
            ->get();

        return response()->json($results);
    }
}
