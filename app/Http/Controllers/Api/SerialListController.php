<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SerialListResource;
use App\Models\SerialList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;


class SerialListController extends Controller
{

    public function index()
    {
        $serials = SerialList::latest()->get();
        return SerialListResource::collection($serials);
    }


    public function store(Request $request)
    {

        $data = $request->validate([
            'stock_id' => 'required|exists:stocks,id',
            'sku' => 'required|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'status' => 'required|in:active,inactive',
        ]);


        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $folder = public_path('serial_images');

            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }

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


    public function show($id)
    {
        $serial = SerialList::findOrFail($id);
        return new SerialListResource($serial);
    }



    public function update(Request $request, $id)
    {
        $serial = SerialList::findOrFail($id);


        $data = $request->validate([
            'stock_id' => 'nullable|exists:stocks,id',
            'sku' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
           'status' => 'required|in:active,inactive',
        ]);


        if ($request->hasFile('image')) {

            if ($serial->image && File::exists(public_path($serial->image))) {
                File::delete(public_path($serial->image));
            }

            $image = $request->file('image');
            $folder = public_path('serial_images');

            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }

            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'serial_images/' . $imageName;
        }

        $serial->update($data);
        $serial->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Serial updated successfully',
            'data' => new SerialListResource($serial)
        ], 200);
    }


    public function destroy($id)
    {
        $serial = SerialList::findOrFail($id);

        if ($serial->image && File::exists(public_path($serial->image))) {
            File::delete(public_path($serial->image));
        }

        $serial->delete();

        return response()->json([
            'success' => true,
            'message' => 'Serial deleted successfully'
        ]);
    }
}
