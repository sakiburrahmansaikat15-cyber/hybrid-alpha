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
        $limit = (int) $request->query('limit', 10);
        $page = (int) $request->query('page', 1);

        $serials = SerialList::latest()->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Serials fetched successfully',
            'page' => $serials->currentPage(),
            'perPage' => $serials->perPage(),
            'totalItems' => $serials->total(),
            'totalPages' => $serials->lastPage(),
            'data' => SerialListResource::collection($serials->items()),
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

    // ✅ Search serials
    public function search(Request $request)
    {
        $keyword = $request->query('keyword', '');

        $serials = SerialList::where('color', 'like', "%{$keyword}%")
            ->get();

        return response()->json([
            'message' => 'Search results fetched successfully',
            'data' => SerialListResource::collection($serials),
        ]);
    }
}
