<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentTypeResource;
use App\Models\PaymentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;

class PaymentTypeController extends Controller
{
    // ✅ List all payment types with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 10);
        $page = (int) $request->query('page', 1);

        $paymentTypes = PaymentType::latest()->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'message' => 'Payment Types fetched successfully',
            'page' => $paymentTypes->currentPage(),
            'perPage' => $paymentTypes->perPage(),
            'totalItems' => $paymentTypes->total(),
            'totalPages' => $paymentTypes->lastPage(),
            'data' => PaymentTypeResource::collection($paymentTypes->items()),
        ]);
    }

    // ✅ Store a new payment type
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
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
            $folder = public_path('payment_types');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
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

    // ✅ Show a single payment type
    public function show($id)
    {
        $paymentType = PaymentType::find($id);

        if (!$paymentType) {
            return response()->json([
                'success' => false,
                'message' => 'Payment Type not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new PaymentTypeResource($paymentType)
        ], 200);
    }

    // ✅ Update a payment type
    public function update(Request $request, $id)
    {
        $paymentType = PaymentType::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:255',
            'account_number' => 'sometimes|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // ✅ Handle image update
        if ($request->hasFile('image')) {
            if ($paymentType->image && File::exists(public_path($paymentType->image))) {
                File::delete(public_path($paymentType->image));
            }

            $folder = public_path('payment_types');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'payment_types/' . $imageName;
        }

        $paymentType->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Payment Type updated successfully',
            'data' => new PaymentTypeResource($paymentType)
        ], 200);
    }

    // ✅ Delete a payment type
    public function destroy($id)
    {
        $paymentType = PaymentType::find($id);

        if (!$paymentType) {
            return response()->json([
                'success' => false,
                'message' => 'Payment Type not found'
            ], 404);
        }

        if ($paymentType->image && File::exists(public_path($paymentType->image))) {
            File::delete(public_path($paymentType->image));
        }

        $paymentType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment Type deleted successfully'
        ], 200);
    }

    // ✅ Search payment types
    public function search(Request $request)
    {
        $keyword = $request->query('keyword', '');

        $paymentTypes = PaymentType::where('name', 'like', "%{$keyword}%")
            ->orWhere('type', 'like', "%{$keyword}%")
            ->orWhere('account_number', 'like', "%{$keyword}%")
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Search results fetched successfully',
            'data' => PaymentTypeResource::collection($paymentTypes),
        ]);
    }
}
