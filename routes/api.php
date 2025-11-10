<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductTypeController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\PaymentTypeController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\SubCategoryController;
use App\Http\Controllers\Api\SubItemController;
use App\Http\Controllers\api\vendorController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\VariantController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\SerialListController;


Route::prefix('roles')->group(function () {
    Route::get('/', [RoleController::class, 'index']);       // GET /api/roles
    Route::post('/', [RoleController::class, 'store']);      // POST /api/roles
    Route::get('/{id}', [RoleController::class, 'show']);    // GET /api/roles/{id}
    Route::put('/{id}', [RoleController::class, 'update']);  // PUT /api/roles/{id}
    Route::delete('/{id}', [RoleController::class, 'destroy']); // DELETE /api/roles/{id}


});





Route::prefix('units')->group(function () {
    Route::get('/', [UnitController::class, 'index']);       // GET /api/units
    Route::post('/', [UnitController::class, 'store']);      // POST /api/units
    Route::get('/{id}', [UnitController::class, 'show']);    // GET /api/units/{id}
    Route::put('/{id}', [UnitController::class, 'update']);  // PUT /api/units/{id}
    Route::delete('/{id}', [UnitController::class, 'destroy']); // DELETE /api/units/{id}
});

Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::get('/{id}', [CategoryController::class, 'show']);
    Route::put('/{id}', [CategoryController::class, 'update']);
    Route::delete('/{id}', [CategoryController::class, 'destroy']);
    Route::patch('/{id}/status', [CategoryController::class, 'updateStatus']);
});





Route::prefix('payment-types')->group(function () {
    Route::get('/', [PaymentTypeController::class, 'index']);           // List all (with pagination/search)
    Route::post('/', [PaymentTypeController::class, 'store']);          // Create new payment type
    Route::get('/{id}', [PaymentTypeController::class, 'show']);        // Show single by ID
    Route::put('/{id}', [PaymentTypeController::class, 'update']);      // Update payment type
    Route::delete('/{id}', [PaymentTypeController::class, 'destroy']);  // Delete payment type
});


Route::prefix('vendors')->group(function () {
    Route::get('/', [vendorController::class, 'index']);
    Route::post('/', [vendorController::class, 'store']);
    Route::get('/search', [vendorController::class, 'search']);   // GET /api/vendors/search?search=
    Route::get('/{id}', [vendorController::class, 'show']);
    Route::put('/{id}', [vendorController::class, 'update']);
    Route::delete('/{id}', [vendorController::class, 'destroy']); 
});








Route::prefix('product-types')->group(function () {
    Route::get('/', [ProductTypeController::class, 'index']);
    Route::post('/', [ProductTypeController::class, 'store']);
    Route::get('/{id}', [ProductTypeController::class, 'show']);
    Route::put('/{id}', [ProductTypeController::class, 'update']);
    Route::delete('/{id}', [ProductTypeController::class, 'destroy']);
});

Route::prefix('brands')->group(function () {
    Route::get('/', [BrandController::class, 'index']);
    Route::post('/', [BrandController::class, 'store']);
    Route::get('/{brand}', [BrandController::class, 'show']);
    Route::put('/{brand}', [BrandController::class, 'update']); // Use PUT instead of POST
    Route::delete('/{brand}', [BrandController::class, 'destroy']);
});



Route::prefix('warehouses')->name('warehouses.')->group(function () {
    Route::get('/', [WarehouseController::class, 'index'])->name('index');
    Route::post('/', [WarehouseController::class, 'store'])->name('store');
    Route::get('{id}', [WarehouseController::class, 'show'])->name('show');
    Route::put('{id}', [WarehouseController::class, 'update'])->name('update');
    Route::delete('{id}', [WarehouseController::class, 'destroy'])->name('destroy');
});



Route::prefix('sub-categories')->group(function () {
    Route::get('/', [SubCategoryController::class, 'index']);              // GET /api/sub-categories
    Route::post('/', [SubCategoryController::class, 'store']);             // POST /api/sub-categories
    Route::get('/search', [SubCategoryController::class, 'search']);       // GET /api/sub-categories/search?search=
    Route::get('/{id}', [SubCategoryController::class, 'show']);           // GET /api/sub-categories/{id}
    Route::put('/{id}', [SubCategoryController::class, 'update']);         // PUT /api/sub-categories/{id}
    Route::delete('/{id}', [SubCategoryController::class, 'destroy']);     // DELETE /api/sub-categories/{id}
});



Route::prefix('sub-items')->group(function () {
    Route::get('/', [SubItemController::class, 'index']);                // GET /api/sub-items
    Route::post('/', [SubItemController::class, 'store']);               // POST /api/sub-items
    Route::get('/search', [SubItemController::class, 'search']);         // GET /api/sub-items/search?search=
    Route::get('/{id}', [SubItemController::class, 'show']);             // GET /api/sub-items/{id}
    Route::put('/{id}', [SubItemController::class, 'update']);           // PUT /api/sub-items/{id}
    Route::delete('/{id}', [SubItemController::class, 'destroy']);       // DELETE /api/sub-items/{id}
});



Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);               // GET /api/products
    Route::post('/', [ProductController::class, 'store']);              // POST /api/products
    Route::get('/search', [ProductController::class, 'search']);        // GET /api/products/search?search=
    Route::get('/{id}', [ProductController::class, 'show']);            // GET /api/products/{id}
    Route::put('/{id}', [ProductController::class, 'update']);          // PUT /api/products/{id}
    Route::delete('/{id}', [ProductController::class, 'destroy']);      // DELETE /api/products/{id}
});

Route::prefix('variants')->group(function () {
    Route::get('/', [VariantController::class, 'index']);               // GET /api/variants
    Route::post('/', [VariantController::class, 'store']);              // POST /api/variants
    Route::get('/search', [VariantController::class, 'search']);        // GET /api/variants/search?search=
    Route::get('/{id}', [VariantController::class, 'show']);            // GET /api/variants/{id}
    Route::put('/{id}', [VariantController::class, 'update']);          // PUT /api/variants/{id}
    Route::delete('/{id}', [VariantController::class, 'destroy']);      // DELETE /api/variants/{id}
});




Route::prefix('stocks')->group(function () {
    Route::get('/', [StockController::class, 'index']);               // GET all
    Route::post('/', [StockController::class, 'store']);              // CREATE
    Route::get('/search', [StockController::class, 'search']);        // SEARCH
    Route::get('/{id}', [StockController::class, 'show']);            // SHOW ONE
    Route::put('/{id}', [StockController::class, 'update']);          // UPDATE
    Route::delete('/{id}', [StockController::class, 'destroy']);      // DELETE
});




Route::prefix('serial-list')->group(function () {

    Route::get('/', [SerialListController::class, 'index']);            // GET all
    Route::post('/', [SerialListController::class, 'store']);           // CREATE
    Route::get('/search', [SerialListController::class, 'search']);     // SEARCH
    Route::get('/{id}', [SerialListController::class, 'show']);         // SHOW
    Route::put('/{id}', [SerialListController::class, 'update']);       // UPDATE
    Route::delete('/{id}', [SerialListController::class, 'destroy']);   // DELETE
});

