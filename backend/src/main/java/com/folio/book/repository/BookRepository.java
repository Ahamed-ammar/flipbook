package com.folio.book.repository;

import com.folio.book.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

    Page<Book> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT b FROM Book b WHERE b.user.id = :userId " +
           "AND (LOWER(b.title) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "  OR LOWER(b.author) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<Book> searchByUser(@Param("userId") Long userId,
                            @Param("q") String query,
                            Pageable pageable);

    Optional<Book> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);

    Optional<Book> findByFileHashAndUserId(String fileHash, Long userId);

    boolean existsByFileHashAndUserId(String fileHash, Long userId);

    List<Book> findTop6ByUserIdOrderByCreatedAtDesc(Long userId);
}
