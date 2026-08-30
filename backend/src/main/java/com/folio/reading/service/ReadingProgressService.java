package com.folio.reading.service;

import com.folio.auth.entity.User;
import com.folio.auth.repository.UserRepository;
import com.folio.book.entity.Book;
import com.folio.book.repository.BookRepository;
import com.folio.common.ResourceNotFoundException;
import com.folio.reading.dto.ProgressResponse;
import com.folio.reading.entity.ReadingProgress;
import com.folio.reading.repository.ReadingProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReadingProgressService {

    private final ReadingProgressRepository progressRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    /**
     * Returns the reading progress for a given book and user.
     * If no progress exists, returns a default response at page 1 with 0%.
     */
    public ProgressResponse getProgress(Long bookId, Long userId) {
        return progressRepository.findByUserIdAndBookId(userId, bookId)
                .map(ProgressResponse::from)
                .orElseGet(() -> {
                    // Verify the book exists and belongs to the user before returning a default
                    bookRepository.findByIdAndUserId(bookId, userId)
                            .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
                    return new ProgressResponse(bookId, 1, 0.0, null);
                });
    }

    /**
     * Creates or updates reading progress for a book.
     * Calculates percentage from book.totalPages.
     */
    @Transactional
    public ProgressResponse saveProgress(Long bookId, Long userId, int currentPage) {
        Book book = bookRepository.findByIdAndUserId(bookId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        double percentage = 0.0;
        if (book.getTotalPages() != null && book.getTotalPages() > 0) {
            percentage = Math.min(100.0,
                    Math.round((double) currentPage / book.getTotalPages() * 1000.0) / 10.0);
        }

        ReadingProgress progress = progressRepository
                .findByUserIdAndBookId(userId, bookId)
                .orElseGet(() -> ReadingProgress.builder()
                        .user(user)
                        .book(book)
                        .build());

        progress.setCurrentPage(currentPage);
        progress.setProgressPercentage(percentage);
        progress.setLastReadAt(LocalDateTime.now());

        return ProgressResponse.from(progressRepository.save(progress));
    }
}
