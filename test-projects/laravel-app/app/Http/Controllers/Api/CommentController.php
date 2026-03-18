<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CommentController extends Controller
{
    /**
     * Display a listing of comments for a post.
     */
    public function index(Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->with(['user', 'replies'])
            ->topLevel()
            ->latest()
            ->paginate(20);
        
        return response()->json($comments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'post_id' => 'required|exists:posts,id',
            'parent_id' => 'nullable|exists:comments,id',
        ]);
        
        $validated['user_id'] = auth()->id();
        
        $comment = Comment::create($validated);
        
        return response()->json($comment->load('user'), 201);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);
        
        $comment->delete();
        
        return response()->json(['message' => 'Comment deleted successfully']);
    }
}
