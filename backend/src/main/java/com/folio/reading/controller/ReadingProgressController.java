package com.folio.reading.controller;

import com.folio.reading.dto.ProgressRequest;
import com.folio.reading.dto.ProgressResponse;
import com.folio.reading.service.ReadingProgressService;
import com.folio.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books/{bookId}/progress")
@RequiredArgsConstructor
public class ReadingProgressController {

    private final ReadingProgressService progressService;

    @GetMapping
    public ResponseEntity<ProgressResponse> getProgress(
            @PathVariable Long bookId,
            @CurrentUser Long userId
    ) {
        return ResponseEntity.ok(progressService.getProgress(bookId, userId));
    }

    @PutMapping
    public ResponseEntity<ProgressResponse> saveProgress(
            @PathVariable Long bookId,
            @CurrentUser Long userId,
            @Valid @RequestBody ProgressRequest req
    ) {
        return ResponseEntity.ok(progressService.saveProgress(bookId, userId, req.currentPage()));
    }
}
