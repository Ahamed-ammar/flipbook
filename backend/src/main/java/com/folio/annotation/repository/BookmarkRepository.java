package com.folio.annotation.repository;

import com.folio.annotation.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    List<Bookmark> findByBookIdAndUserIdOrderByCreatedAtDesc(Long bookId, Long userId);

    List<Bookmark> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Bookmark> findByIdAndUserId(Long id, Long userId);

    void deleteByBookId(Long bookId);

    long countByBookIdAndUserId(Long bookId, Long userId);

    long countByUserId(Long userId);
}
