package com.example.demo.controllers;

import com.example.demo.models.Post;
import com.example.demo.services.PostService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        return postService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Post>> getPostsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(postService.findByUserId(userId));
    }

    @GetMapping("/published")
    public ResponseEntity<List<Post>> getPublishedPosts() {
        return ResponseEntity.ok(postService.findPublished());
    }

    @PostMapping
    public ResponseEntity<Post> createPost(@Valid @RequestBody PostCreateRequest request) {
        Post post = new Post();
        post.setTitle(request.title());
        post.setContent(request.content());
        
        Post createdPost = postService.create(post, request.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> updatePost(@PathVariable Long id, @Valid @RequestBody PostUpdateRequest request) {
        Post postDetails = new Post();
        postDetails.setTitle(request.title());
        postDetails.setContent(request.content());
        
        Post updatedPost = postService.update(id, postDetails);
        return ResponseEntity.ok(updatedPost);
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<Post> publishPost(@PathVariable Long id) {
        Post publishedPost = postService.publish(id);
        return ResponseEntity.ok(publishedPost);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record PostCreateRequest(
            @NotBlank(message = "Title is required")
            String title,
            
            String content,
            
            @NotNull(message = "User ID is required")
            Long userId
    ) {}

    public record PostUpdateRequest(
            @NotBlank(message = "Title is required")
            String title,
            
            String content
    ) {}
}