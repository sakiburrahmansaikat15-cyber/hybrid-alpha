<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductsResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use App\Http\Requests\Api\StoreProductRequest;
use App\Http\Requests\Api\UpdateProductRequest;

class ProductController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:products.view')->only(['index', 'show']);
        $this->middleware('permission:products.create')->only(['store']);
        $this->middleware('permission:products.edit')->only(['update']);
        $this->middleware('permission:products.delete')->only(['destroy']);
    }
    // ✅ List all products with pagination
    public function index(Request $request)
    {
        $keyword = $request->query('keyword', '');
        $limit = $request->query('limit');

        // Include related models & only select necessary columns from products
        $query = Product::with([
            "category:id,name",
            "brand:id,name",
            "subCategory:id,name",
            "unit:id,name",
            "productType:id,name"
        ]);


        $status = $request->query('status');
        $cat_id = $request->query('cat_id');

        // 🔍 Apply search if keyword provided
        if ($keyword) {
            $query->where('name', 'like', "%{$keyword}%");
        }

        // 🏷️ Apply Filters
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($cat_id && $cat_id !== 'all') {
            $query->where('cat_id', $cat_id);
        }

        // 📄 Enforce pagination for better performance
        $limit = (int) ($limit ?: 15);
        $products = $query->latest()->paginate($limit);

        return response()->json([
            'message' => 'Products fetched successfully',
            'pagination' => [
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total_items' => $products->total(),
                'total_pages' => $products->lastPage(),
                'data' => ProductsResource::collection($products),
            ],
        ]);
    }


    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();

        // ✅ Secure image upload with validation
        if ($request->hasFile('image')) {
            $folder = public_path('products');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'products/' . $imageName;
        }

        $product = Product::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => new ProductsResource($product)
        ], 201);
    }

    // ✅ Show a single product
    public function show($id)
    {
        $product = Product::with(['category', 'brand', 'subCategory', 'subItem', 'unit', 'productType'])->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ProductsResource($product)
        ], 200);
    }

    public function update(UpdateProductRequest $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $data = $request->validated();

        // ✅ Secure image update with validation
        if ($request->hasFile('image')) {
            if ($product->image && File::exists(public_path($product->image))) {
                File::delete(public_path($product->image));
            }

            $folder = public_path('products');
            if (!File::exists($folder)) {
                File::makeDirectory($folder, 0777, true);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();
            $image->move($folder, $imageName);
            $data['image'] = 'products/' . $imageName;
        }

        $product->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => new ProductsResource($product)
        ], 200);
    }

    // ✅ Delete product
    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        // Delete image using Storage
        if ($product->image && File::exists(public_path($product->image))) {
            File::delete(public_path($product->image));
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ], 200);
    }
}
