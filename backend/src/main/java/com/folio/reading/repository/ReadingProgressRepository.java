package com.folio.reading.repository;

import com.folio.reading.entity.ReadingProgress;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, Long> {

    Optional<ReadingProgress> findByUserIdAndBookId(Long userId, Long bookId);

    void deleteByBookIdAndUserId(Long bookId, Long userId);

    void deleteByBookId(Long bookId);

    @Query("SELECT rp FROM ReadingProgress rp " +
           "JOIN FETCH rp.book b " +
           "WHERE rp.user.id = :userId " +
           "AND rp.lastReadAt IS NOT NULL " +
           "ORDER BY rp.lastReadAt DESC")
    List<ReadingProgress> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);
}
