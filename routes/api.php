<?php

use App\Http\Controllers\Api\BrandController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


use App\Http\Controllers\Api\TransactionsController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\CategoriesController;
use App\Http\Controllers\Api\PaymentTypeController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductTypeController;
use App\Http\Controllers\Api\SerialListController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\SubCategoryController;
use App\Http\Controllers\Api\SubItemController;
use App\Http\Controllers\Api\VariantController;
use App\Http\Controllers\Api\VendorController;

Route::prefix('units')->group(function () {
    Route::get('/', [UnitController::class, 'index']);
    Route::post('/', [UnitController::class, 'store']);
    Route::get('/{id}', [UnitController::class, 'show']);
    Route::put('/{id}', [UnitController::class, 'update']);
    Route::delete('/{id}', [UnitController::class, 'destroy']);
});


Route::prefix('categories')->group(function () {
    Route::get('/', [CategoriesController::class, 'index']);
    Route::post('/', [CategoriesController::class, 'store']);
    Route::get('/{id}', [CategoriesController::class, 'show']);
    Route::put('/{id}', [CategoriesController::class, 'update']);
    Route::delete('/{id}', [CategoriesController::class, 'destroy']);
});



Route::prefix('sub-categories')->group(function () {
    Route::get('/', [SubCategoryController::class, 'index']);
    Route::post('/', [SubCategoryController::class, 'store']);
    Route::get('/{id}', [SubCategoryController::class, 'show']);
    Route::post('/{id}', [SubCategoryController::class, 'update']);
    Route::delete('/{id}', [SubCategoryController::class, 'destroy']);
});




Route::prefix('sub-item')->group(function () {
    Route::get('/', [SubItemController::class, 'index']);
    Route::post('/', [SubItemController::class, 'store']);
    Route::get('/{id}', [SubItemController::class, 'show']);
    Route::put('/{id}', [SubItemController::class, 'update']);
    Route::delete('/{id}', [SubItemController::class, 'destroy']);
});



Route::prefix('brands')->group(function () {
    Route::get('/', [BrandController::class, 'index']);
    Route::post('/', [BrandController::class, 'store']);
    Route::get('/{id}', [BrandController::class, 'show']);
    Route::put('/{id}', [BrandController::class, 'update']);
    Route::delete('/{id}', [BrandController::class, 'destroy']);
});


Route::prefix('product-type')->group(function () {
    Route::get('/', [ProductTypeController::class, 'index']);
    Route::post('/', [ProductTypeController::class, 'store']);
    Route::get('/{id}', [ProductTypeController::class, 'show']);
    Route::put('/{id}', [ProductTypeController::class, 'update']);
    Route::delete('/{id}', [ProductTypeController::class, 'destroy']);
});



Route::prefix('product')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::post('/', [ProductController::class, 'store']);
    Route::get('/{id}', [ProductController::class, 'show']);
    Route::put('/{id}', [ProductController::class, 'update']);
    Route::delete('/{id}', [ProductController::class, 'destroy']);
});



Route::prefix('variants')->group(function () {
    Route::get('/', [VariantController::class, 'index']);
    Route::post('/', [VariantController::class, 'store']);
    Route::get('/{id}', [VariantController::class, 'show']);
    Route::put('/{id}', [VariantController::class, 'update']);
    Route::delete('/{id}', [VariantController::class, 'destroy']);
});




Route::prefix('vendor')->group(function () {
    Route::get('/', [VendorController::class, 'index']);
    Route::post('/', [VendorController::class, 'store']);
    Route::get('/{id}', [VendorController::class, 'show']);
    Route::put('/{id}', [VendorController::class, 'update']);
    Route::delete('/{id}', [VendorController::class, 'destroy']);
});



Route::prefix('payment-type')->group(function () {
    Route::get('/', [PaymentTypeController::class, 'index']);
    Route::post('/', [PaymentTypeController::class, 'store']);
    Route::get('/{id}', [PaymentTypeController::class, 'show']);
    Route::put('/{id}', [PaymentTypeController::class, 'update']);
    Route::delete('/{id}', [PaymentTypeController::class, 'destroy']);
});




Route::prefix('stocks')->group(function () {
    Route::get('/', [StockController::class, 'index']);
    Route::post('/', [StockController::class, 'store']);
    Route::get('/{id}', [StockController::class, 'show']);
    Route::put('/{id}', [StockController::class, 'update']);
    Route::delete('/{id}', [StockController::class, 'destroy']);
});



Route::prefix('serial-list')->group(function () {
    Route::get('/', [SerialListController::class, 'index']);
    Route::post('/', [SerialListController::class, 'store']);
    Route::get('/{id}', [SerialListController::class, 'show']);
    Route::put('/{id}', [SerialListController::class, 'update']);
    Route::delete('/{id}', [SerialListController::class, 'destroy']);
});




Route::prefix('transaction')->group(function () {
    Route::get('/', [TransactionsController::class, 'index']);
    Route::post('/', [TransactionsController::class, 'store']);
    Route::get('/{id}', [TransactionsController::class, 'show']);
    Route::put('/{id}', [TransactionsController::class, 'update']);
    Route::delete('/{id}', [TransactionsController::class, 'destroy']);
});


