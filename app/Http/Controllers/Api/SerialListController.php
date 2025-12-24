<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SerialListResource;
use App\Models\SerialList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class SerialListController extends Controller
{
    // ✅ List all serials with pagination
      public function index(Request $request)
    {
         $keyword = $request->query('keyword', '');
        $limit = (int) $request->query('limit', 10);
       

        // 🧭 Base query
        $query = SerialList::query();

        // 🔍 Apply search if keyword provided
       if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('color', 'like', "%{$keyword}%")
                  ->orWhere('sku', 'like', "%{$keyword}%")
                  ->orWhere('barcode', 'like', "%{$keyword}%")
                  ->orWhere('notes', 'like', "%{$keyword}%");
            });
        }

        // 📄 Paginate results
        $serials = $query->latest()->paginate($limit);

        // ✅ Return response
        return response()->json([
            'message' => 'Serials fetched successfully',
            'pagination' => [
                'current_page' => $serials->currentPage(),
                'per_page' => $serials->perPage(),
                'total_items' => $serials->total(),
                'total_pages' => $serials->lastPage(),
                'data' => SerialListResource::collection($serials),
            ],
        ]);
    }

    // ✅ Create a new serial
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'stock_id' => 'required|exists:stocks,id',
            'sku' => 'required|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // ✅ Handle image upload
        if ($request->hasFile('image')) {
            $folder = public_path('serial_images');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'serial_images/' . $imageName;
        }

        $serial = SerialList::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Serial created successfully',
            'data' => new SerialListResource($serial)
        ], 201);
    }

    // ✅ Show a single serial
    public function show($id)
    {
        $serial = SerialList::find($id);

        if (!$serial) {
            return response()->json([
                'success' => false,
                'message' => 'Serial not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new SerialListResource($serial)
        ], 200);
    }

    // ✅ Update a serial
    public function update(Request $request, $id)
    {
        $serial = SerialList::find($id);

        if (!$serial) {
            return response()->json([
                'success' => false,
                'message' => 'Serial not found'
            ], 404);
        }

        $data = $request->validate([
            'stock_id' => 'nullable|exists:stocks,id',
            'sku' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'sometimes|in:active,inactive',
        ]);

        // ✅ Handle image update
        if ($request->hasFile('image')) {
            if ($serial->image && File::exists(public_path($serial->image))) {
                File::delete(public_path($serial->image));
            }

            $folder = public_path('serial_images');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'serial_images/' . $imageName;
        }

        $serial->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Serial updated successfully',
            'data' => new SerialListResource($serial)
        ], 200);
    }

    // ✅ Delete a serial
    public function destroy($id)
    {
        $serial = SerialList::find($id);

        if (!$serial) {
            return response()->json([
                'success' => false,
                'message' => 'Serial not found'
            ], 404);
        }

        if ($serial->image && File::exists(public_path($serial->image))) {
            File::delete(public_path($serial->image));
        }

        $serial->delete();

        return response()->json([
            'success' => true,
            'message' => 'Serial deleted successfully'
        ], 200);
    }
}
