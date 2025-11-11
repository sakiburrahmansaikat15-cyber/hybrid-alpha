<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubItem;
use Illuminate\Http\Request;

class SubItemController extends Controller
{
    public function index(Request $request)
    {
        $query = SubItem::with('subCategory');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $limit = $request->input('limit', 10);
        $subItems = $query->paginate($limit);

        return response()->json($subItems);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sub_category_id' => 'required|exists:sub_categories,id',
            'name' => 'required|string|max:255',
            'status' => 'boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $fileName = time() . '_' . $request->image->getClientOriginalName();
            $request->image->move(public_path('sub-items'), $fileName);
            $validated['image'] = 'sub-items/' . $fileName;
        }

        $subItem = SubItem::create($validated);

        return response()->json($subItem, 201);
    }

    public function show($id)
    {
        $subItem = SubItem::with('subCategory')->findOrFail($id);
        return response()->json($subItem);
    }

    public function update(Request $request, $id)
    {
        $subItem = SubItem::findOrFail($id);

        $validated = $request->validate([
            'sub_category_id' => 'required|exists:sub_categories,id',
            'name' => 'required|string|max:255',
            'status' => 'boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {

            if ($subItem->image && file_exists(public_path($subItem->image))) {
                unlink(public_path($subItem->image));
            }

            $fileName = time() . '_' . $request->image->getClientOriginalName();
            $request->image->move(public_path('sub-items'), $fileName);
            $validated['image'] = 'sub-items/' . $fileName;
        }

        $subItem->update($validated);

        return response()->json($subItem);
    }

    public function destroy($id)
    {
        $subItem = SubItem::findOrFail($id);

        if ($subItem->image && file_exists(public_path($subItem->image))) {
            unlink(public_path($subItem->image));
        }

        $subItem->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
