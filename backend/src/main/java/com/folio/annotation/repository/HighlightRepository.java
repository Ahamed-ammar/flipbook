package com.folio.annotation.repository;

import com.folio.annotation.entity.Highlight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HighlightRepository extends JpaRepository<Highlight, Long> {

    List<Highlight> findByBookIdAndUserIdOrderByCreatedAtDesc(Long bookId, Long userId);

    List<Highlight> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Highlight> findByIdAndUserId(Long id, Long userId);

    void deleteByBookId(Long bookId);

    long countByUserId(Long userId);
}
