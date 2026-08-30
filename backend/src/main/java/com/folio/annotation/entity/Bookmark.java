package com.folio.annotation.entity;

import com.folio.auth.entity.User;
import com.folio.book.entity.Book;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookmarks", indexes = {
    @Index(name = "idx_bookmarks_user_id", columnList = "user_id"),
    @Index(name = "idx_bookmarks_book_id", columnList = "book_id"),
    @Index(name = "idx_bookmarks_page", columnList = "page_number")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "page_number", nullable = false)
    private Integer pageNumber;

    @Column
    private String label;

    @Column(name = "chapter_title")
    private String chapterTitle;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
