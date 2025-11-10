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

Route::prefix('payment-types')->name('payment-types.')->group(function () {
    Route::get('/', [PaymentTypeController::class, 'index']);
    Route::post('/', [PaymentTypeController::class, 'store']);
    Route::get('{payment}', [PaymentTypeController::class, 'show']);
    Route::put('{payment}', [PaymentTypeController::class, 'update']);
    Route::delete('{payment}', [PaymentTypeController::class, 'destroy']);
});


Route::prefix('warehouses')->name('warehouses.')->group(function () {
    Route::get('/', [WarehouseController::class, 'index'])->name('index');
    Route::post('/', [WarehouseController::class, 'store'])->name('store');
    Route::get('{id}', [WarehouseController::class, 'show'])->name('show');
    Route::put('{id}', [WarehouseController::class, 'update'])->name('update');
    Route::delete('{id}', [WarehouseController::class, 'destroy'])->name('destroy');
});