package com.folio.reading.entity;

import com.folio.auth.entity.User;
import com.folio.book.entity.Book;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reading_progress",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "book_id"}),
    indexes = {
        @Index(name = "idx_progress_user_id", columnList = "user_id"),
        @Index(name = "idx_progress_book_id", columnList = "book_id"),
        @Index(name = "idx_progress_last_read", columnList = "last_read_at")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReadingProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "current_page", nullable = false)
    private Integer currentPage;

    @Column(name = "progress_percentage")
    private Double progressPercentage;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        lastReadAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        lastReadAt = LocalDateTime.now();
    }
}
