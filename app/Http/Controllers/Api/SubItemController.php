<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubItem;
use Illuminate\Http\Request;

class SubItemController extends Controller
{
    // LIST ALL
    public function index()
    {
        return response()->json(SubItem::with('subCategory')->get());
    }

    // CREATE
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sub_category_id' => 'required|exists:sub_categories,id',
            'name' => 'required|string|max:255',
            'status' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->image;
            $fileName = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('sub-items'), $fileName);
            $validated['image'] = 'sub-items/' . $fileName;
        }

        $subItem = SubItem::create($validated);

        return response()->json($subItem, 201);
    }

    // SHOW
    public function show(SubItem $subItem)
    {
        return response()->json($subItem->load('subCategory'));
    }

    // UPDATE
    public function update(Request $request, SubItem $subItem)
    {
        $validated = $request->validate([
            'sub_category_id' => 'required|exists:sub_categories,id',
            'name' => 'required|string|max:255',
            'status' => 'required|boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($subItem->image && file_exists(public_path($subItem->image))) {
                unlink(public_path($subItem->image));
            }

            $file = $request->image;
            $fileName = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('sub-items'), $fileName);
            $validated['image'] = 'sub-items/' . $fileName;
        }

        $subItem->update($validated);

        return response()->json($subItem);
    }

    // DELETE
    public function destroy(SubItem $subItem)
    {
        if ($subItem->image && file_exists(public_path($subItem->image))) {
            unlink(public_path($subItem->image));
        }

        $subItem->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
