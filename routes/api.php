<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\RoleController;

Route::prefix('roles')->group(function () {
    Route::get('/', [RoleController::class, 'index']);       // GET /api/roles
    Route::post('/', [RoleController::class, 'store']);      // POST /api/roles
    Route::get('/{id}', [RoleController::class, 'show']);    // GET /api/roles/{id}
    Route::put('/{id}', [RoleController::class, 'update']);  // PUT /api/roles/{id}
    Route::delete('/{id}', [RoleController::class, 'destroy']); // DELETE /api/roles/{id}
});