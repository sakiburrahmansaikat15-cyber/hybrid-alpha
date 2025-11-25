<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentTypeResource;
use App\Models\PaymentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class PaymentTypeController extends Controller
{
    // List all payment types
    public function index()
    {
        $paymentTypes = PaymentType::get();
        return PaymentTypeResource::collection($paymentTypes);
    }

    // Store a new payment type
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'notes' => 'sometimes|string',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

           $data['status'] = $request->status;


        // Handle image upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $folder = public_path('payment_types');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true, true);
            }
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'payment_types/' . $imageName;
        }

        $paymentType = PaymentType::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Payment Type created successfully',
            'data' => new PaymentTypeResource($paymentType)
        ], 201);
    }

    // Show a single payment type
    public function show($id)
    {
        $paymentType = PaymentType::findOrFail($id);
        return new PaymentTypeResource($paymentType);
    }

    // Update a payment type
    public function update(Request $request, $id)
{
    Log::info("---- UPDATE PAYMENT TYPE START ----");

    Log::info("Raw Input:", $request->all());

    $paymentType = PaymentType::findOrFail($id);

    $data = $request->validate([
        'name' => 'sometimes|string|max:255',
        'type' => 'sometimes|string|max:255',
        'account_number' => 'sometimes|string|max:255',
        'notes' => 'sometimes|string',
        'status' => 'required|in:active,inactive',
        'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
    ]);

    Log::info("Validated Data:", $data);

    // Force correct status
    $data['status'] = $request->status;

    Log::info("Final Status Value:", ['status' => $data['status']]);

    // Handle image update
    if ($request->hasFile('image')) {

        Log::info("Image uploaded: " . $request->file('image')->getClientOriginalName());

        if ($paymentType->image && File::exists(public_path($paymentType->image))) {
            File::delete(public_path($paymentType->image));
            Log::info("Old image deleted");
        }

        $image = $request->file('image');
        $folder = public_path('payment_types');

        if (!File::exists($folder)) {
            File::makeDirectory($folder, 0777, true, true);
            Log::info("Image folder created");
        }

        $imageName = time() . '_' . $image->getClientOriginalName();
        $image->move($folder, $imageName);
        $data['image'] = 'payment_types/' . $imageName;

        Log::info("New image saved: " . $data['image']);
    }

    $paymentType->update($data);

    Log::info("Updated Model:", $paymentType->toArray());
    Log::info("---- UPDATE PAYMENT TYPE END ----");

    return response()->json([
        'success' => true,
        'message' => 'Payment Type updated successfully',
        'data' => new PaymentTypeResource($paymentType)
    ], 200);
}

    // Delete a payment type
    public function destroy($id)
    {
        $paymentType = PaymentType::findOrFail($id);

        // Delete image if exists
        if ($paymentType->image && File::exists(public_path($paymentType->image))) {
            File::delete(public_path($paymentType->image));
        }

        $paymentType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment Type deleted successfully'
        ]);
    }
}
