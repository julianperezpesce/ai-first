<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Post::with(['user', 'categories']);
        
        // Filter by published status
        if ($request->has('published')) {
            $request->boolean('published') 
                ? $query->published() 
                : $query->drafts();
        }
        
        // Filter by category
        if ($request->has('category')) {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }
        
        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }
        
        $posts = $query->latest()->paginate(10);
        
        return response()->json($posts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'published' => 'boolean',
            'category_ids' => 'array',
            'category_ids.*' => 'exists:categories,id',
        ]);
        
        $validated['slug'] = Str::slug($validated['title']);
        $validated['user_id'] = auth()->id();
        
        $post = Post::create($validated);
        
        if (isset($validated['category_ids'])) {
            $post->categories()->attach($validated['category_ids']);
        }
        
        if ($validated['published'] ?? false) {
            $post->publish();
        }
        
        return response()->json($post->load(['user', 'categories']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post): JsonResponse
    {
        return response()->json($post->load(['user', 'categories', 'comments.user']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Post $post): JsonResponse
    {
        $this->authorize('update', $post);
        
        $validated = $request->validate([
            'title' => 'string|max:255',
            'content' => 'string',
            'published' => 'boolean',
            'category_ids' => 'array',
            'category_ids.*' => 'exists:categories,id',
        ]);
        
        if (isset($validated['title'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }
        
        $post->update($validated);
        
        if (isset($validated['category_ids'])) {
            $post->categories()->sync($validated['category_ids']);
        }
        
        // Handle publish/unpublish
        if (isset($validated['published'])) {
            $validated['published'] ? $post->publish() : $post->unpublish();
        }
        
        return response()->json($post->load(['user', 'categories']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);
        
        $post->delete();
        
        return response()->json(['message' => 'Post deleted successfully']);
    }

    /**
     * Publish a post.
     */
    public function publish(Post $post): JsonResponse
    {
        $this->authorize('update', $post);
        
        $post->publish();
        
        return response()->json([
            'message' => 'Post published successfully',
            'post' => $post
        ]);
    }

    /**
     * Unpublish a post.
     */
    public function unpublish(Post $post): JsonResponse
    {
        $this->authorize('update', $post);
        
        $post->unpublish();
        
        return response()->json([
            'message' => 'Post unpublished successfully',
            'post' => $post
        ]);
    }

    /**
     * Get posts by current user.
     */
    public function myPosts(Request $request): JsonResponse
    {
        $posts = auth()->user()
            ->posts()
            ->with(['categories'])
            ->latest()
            ->paginate(10);
        
        return response()->json($posts);
    }
}
