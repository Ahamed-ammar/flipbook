package com.folio.annotation.controller;

import com.folio.annotation.dto.*;
import com.folio.annotation.service.AnnotationService;
import com.folio.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class AnnotationController {

    private final AnnotationService annotationService;

    public AnnotationController(AnnotationService annotationService) {
        this.annotationService = annotationService;
    }

    // ── Global annotations ──

    @GetMapping("/api/annotations")
    public ResponseEntity<List<AnnotationDto>> getAllAnnotations(
            @CurrentUser Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(annotationService.getAllAnnotations(userId, pageable));
    }

    @GetMapping("/api/books/{bookId}/annotations")
    public ResponseEntity<List<AnnotationDto>> getBookAnnotations(
            @PathVariable Long bookId,
            @CurrentUser Long userId
    ) {
        return ResponseEntity.ok(annotationService.getBookAnnotations(bookId, userId));
    }

    // ── Highlights ──

    @PostMapping("/api/books/{bookId}/highlights")
    public ResponseEntity<HighlightDto> createHighlight(
            @PathVariable Long bookId,
            @CurrentUser Long userId,
            @Valid @RequestBody CreateHighlightRequest req
    ) {
        return ResponseEntity.status(201).body(annotationService.createHighlight(bookId, userId, req));
    }

    @GetMapping("/api/books/{bookId}/highlights")
    public ResponseEntity<List<HighlightDto>> getHighlights(
            @PathVariable Long bookId,
            @CurrentUser Long userId
    ) {
        return ResponseEntity.ok(annotationService.getHighlights(bookId, userId));
    }

    @DeleteMapping("/api/highlights/{id}")
    public ResponseEntity<Void> deleteHighlight(
            @PathVariable Long id,
            @CurrentUser Long userId
    ) {
        annotationService.deleteHighlight(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ── Bookmarks ──

    @PostMapping("/api/books/{bookId}/bookmarks")
    public ResponseEntity<BookmarkDto> createBookmark(
            @PathVariable Long bookId,
            @CurrentUser Long userId,
            @Valid @RequestBody CreateBookmarkRequest req
    ) {
        return ResponseEntity.status(201).body(annotationService.createBookmark(bookId, userId, req));
    }

    @GetMapping("/api/books/{bookId}/bookmarks")
    public ResponseEntity<List<BookmarkDto>> getBookmarks(
            @PathVariable Long bookId,
            @CurrentUser Long userId
    ) {
        return ResponseEntity.ok(annotationService.getBookmarks(bookId, userId));
    }

    @DeleteMapping("/api/bookmarks/{id}")
    public ResponseEntity<Void> deleteBookmark(
            @PathVariable Long id,
            @CurrentUser Long userId
    ) {
        annotationService.deleteBookmark(id, userId);
        return ResponseEntity.noContent().build();
    }
}
