<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CommentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->group(function () {
    // Posts
    Route::apiResource('posts', PostController::class);
    Route::post('posts/{post}/publish', [PostController::class, 'publish']);
    Route::post('posts/{post}/unpublish', [PostController::class, 'unpublish']);
    Route::get('my-posts', [PostController::class, 'myPosts']);
    
    // Categories
    Route::apiResource('categories', CategoryController::class);
    Route::get('categories/{category}/posts', [CategoryController::class, 'posts']);
    
    // Comments
    Route::apiResource('comments', CommentController::class);
    Route::get('posts/{post}/comments', [CommentController::class, 'index']);
});

// Public routes
Route::get('posts', [PostController::class, 'index']);
Route::get('posts/{post}', [PostController::class, 'show']);
Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category}', [CategoryController::class, 'show']);
