package com.example.demo.controllers;

import com.example.demo.models.Comment;
import com.example.demo.repositories.CommentRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentRepository commentRepository;

    @GetMapping
    public ResponseEntity<List<Comment>> getAllComments() {
        return ResponseEntity.ok(commentRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comment> getCommentById(@PathVariable Long id) {
        return commentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<Comment>> getCommentsByPost(@PathVariable Long postId) {
        return ResponseEntity.ok(commentRepository.findByPostId(postId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Comment>> getCommentsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(commentRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<Comment> createComment(@Valid @RequestBody CommentCreateRequest request) {
        Comment comment = new Comment();
        comment.setContent(request.content());
        // Note: In a real application, you would set the post and user from the request
        // This requires additional service logic
        
        Comment createdComment = commentRepository.save(comment);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdComment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Comment> updateComment(@PathVariable Long id, @Valid @RequestBody CommentUpdateRequest request) {
        return commentRepository.findById(id)
                .map(comment -> {
                    comment.setContent(request.content());
                    return ResponseEntity.ok(commentRepository.save(comment));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        if (!commentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        commentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    public record CommentCreateRequest(
            @NotBlank(message = "Content is required")
            String content,
            
            @NotNull(message = "Post ID is required")
            Long postId,
            
            @NotNull(message = "User ID is required")
            Long userId
    ) {}

    public record CommentUpdateRequest(
            @NotBlank(message = "Content is required")
            String content
    ) {}
}