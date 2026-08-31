package com.folio.book.dto;

import com.folio.book.entity.Book;

import java.time.LocalDateTime;

public record BookDto(
    Long id,
    String title,
    String author,
    String description,
    String coverUrl,
    String fileName,
    Long fileSize,
    Integer totalPages,
    LocalDateTime createdAt,
    ProgressDto progress
) {
    public record ProgressDto(Integer currentPage, Double percentage) {}

    public static BookDto from(Book book) {
        return from(book, null);
    }

    public static BookDto from(Book book, ProgressDto progress) {
        return new BookDto(
            book.getId(),
            book.getTitle(),
            book.getAuthor(),
            book.getDescription(),
            book.getCoverUrl(),
            book.getFileName(),
            book.getFileSize(),
            book.getTotalPages(),
            book.getCreatedAt(),
            progress
        );
    }
}
