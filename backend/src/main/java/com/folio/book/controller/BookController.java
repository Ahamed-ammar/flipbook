package com.folio.book.controller;

import com.folio.book.dto.BookDto;
import com.folio.book.entity.Book;
import com.folio.book.service.BookService;
import com.folio.security.CurrentUser;
import com.folio.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;

@Slf4j
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final StorageService storageService;

    @GetMapping
    public ResponseEntity<Page<BookDto>> list(
            @CurrentUser Long userId,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort
    ) {
        return ResponseEntity.ok(bookService.getBooks(userId, search, page, size, sort));
    }

    @GetMapping("/{bookId}")
    public ResponseEntity<BookDto> get(
            @PathVariable Long bookId,
            @CurrentUser Long userId
    ) {
        return ResponseEntity.ok(bookService.getBook(bookId, userId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BookDto> upload(
            @RequestPart("file") MultipartFile file,
            @CurrentUser Long userId
    ) throws IOException {
        BookDto book = bookService.upload(file, userId);
        return ResponseEntity.status(201).body(book);
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long bookId,
            @CurrentUser Long userId
    ) {
        bookService.deleteBook(bookId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Stream the PDF file — verifies ownership before serving.
     * Auth can come via Authorization header or ?token= query param.
     */
    @GetMapping("/{bookId}/file")
    public ResponseEntity<Resource> getFile(
            @PathVariable Long bookId,
            @CurrentUser Long userId
    ) {
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        Book book = bookService.requireOwnedBook(bookId, userId);
        Path filePath = storageService.resolve(book.getFileUrl());
        Resource resource = new FileSystemResource(filePath);

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + book.getFileName() + "\"")
                .body(resource);
    }
}
