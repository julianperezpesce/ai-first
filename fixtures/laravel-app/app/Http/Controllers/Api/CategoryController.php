<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $categories = Category::withCount('posts')->get();
        return response()->json($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
        ]);
        
        $validated['slug'] = Str::slug($validated['name']);
        
        $category = Category::create($validated);
        
        return response()->json($category, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category): JsonResponse
    {
        return response()->json($category->loadCount('posts'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
        ]);
        
        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }
        
        $category->update($validated);
        
        return response()->json($category);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category): JsonResponse
    {
        $category->delete();
        return response()->json(['message' => 'Category deleted successfully']);
    }

    /**
     * Get posts in this category.
     */
    public function posts(Category $category): JsonResponse
    {
        $posts = $category->posts()
            ->with(['user'])
            ->published()
            ->latest()
            ->paginate(10);
        
        return response()->json($posts);
    }
}
