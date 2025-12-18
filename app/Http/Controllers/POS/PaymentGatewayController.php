<?php

namespace App\Http\Controllers\POS;

use App\Http\Controllers\Controller;
use App\Models\POS\PaymentGateway;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentGatewayController extends Controller
{
    /**
     * 📋 Display a listing of the payment gateways with optional search & pagination
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        $query = PaymentGateway::query();

        // 🔍 Apply search filter
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // ⚙️ If no limit provided, return all data
        if (!$limit) {
            $data = $query->latest()->get();

            return response()->json([
                'message' => 'Payment gateways fetched successfully',
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $data->count(),
                    'total_items' => $data->count(),
                    'total_pages' => 1,
                    'data' => $data,
                ],
            ]);
        }

        // 📄 Paginate results
        $limit = (int) $limit ?: 10;
        $gateways = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Payment gateways fetched successfully',
            'pagination' => [
                'current_page' => $gateways->currentPage(),
                'per_page' => $gateways->perPage(),
                'total_items' => $gateways->total(),
                'total_pages' => $gateways->lastPage(),
                'data' => $gateways->items(),
            ],
        ]);
    }

    /**
     * ➕ Store a newly created payment gateway
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'   => 'required|string|max:255|unique:payment_gateways,name',
            'config' => 'nullable|array',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Convert config array to JSON
        if (isset($data['config'])) {
            $data['config'] = json_encode($data['config']);
        }

        $gateway = PaymentGateway::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Payment gateway created successfully',
            'data'    => $gateway,
        ], 201);
    }

    /**
     * 👁️ Show details of a specific payment gateway
     */
    public function show($id)
    {
        $gateway = PaymentGateway::find($id);

        if (!$gateway) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway not found',
            ], 404);
        }

        // Decode config JSON before returning
        $gateway->config = json_decode($gateway->config, true);

        return response()->json([
            'success' => true,
            'data' => $gateway,
        ], 200);
    }

    /**
     * ✏️ Update an existing payment gateway
     */
    public function update(Request $request, $id)
    {
        $gateway = PaymentGateway::find($id);

        if (!$gateway) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway not found',
            ], 404);
        }

        $data = $request->validate([
            'name'   => 'sometimes|string|max:255|unique:payment_gateways,name,' . $gateway->id,
            'config' => 'nullable|array',
            'status' => 'sometimes|in:active,inactive',
        ]);

        if (isset($data['config'])) {
            $data['config'] = json_encode($data['config']);
        }

        $gateway->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Payment gateway updated successfully',
            'data' => $gateway,
        ], 200);
    }

    /**
     * ❌ Delete a payment gateway
     */
    public function destroy($id)
    {
        $gateway = PaymentGateway::find($id);

        if (!$gateway) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway not found',
            ], 404);
        }

        $gateway->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment gateway deleted successfully',
        ], 200);
    }
}
