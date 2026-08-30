package com.folio.annotation.service;

import com.folio.annotation.dto.*;
import com.folio.annotation.entity.Bookmark;
import com.folio.annotation.entity.Highlight;
import com.folio.annotation.repository.BookmarkRepository;
import com.folio.annotation.repository.HighlightRepository;
import com.folio.auth.entity.User;
import com.folio.auth.repository.UserRepository;
import com.folio.book.entity.Book;
import com.folio.book.repository.BookRepository;
import com.folio.common.AccessDeniedException;
import com.folio.common.ResourceNotFoundException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AnnotationService {

    private final HighlightRepository highlightRepository;
    private final BookmarkRepository bookmarkRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    public AnnotationService(HighlightRepository highlightRepository,
                             BookmarkRepository bookmarkRepository,
                             BookRepository bookRepository,
                             UserRepository userRepository) {
        this.highlightRepository = highlightRepository;
        this.bookmarkRepository  = bookmarkRepository;
        this.bookRepository      = bookRepository;
        this.userRepository      = userRepository;
    }

    // ── Highlights ──

    @Transactional
    public HighlightDto createHighlight(Long bookId, Long userId, CreateHighlightRequest req) {
        Book book = requireOwnedBook(bookId, userId);
        User user = requireUser(userId);

        Highlight highlight = new Highlight();
        highlight.setBook(book);
        highlight.setUser(user);
        highlight.setPageNumber(req.pageNumber());
        highlight.setSelectedText(req.selectedText());
        highlight.setColor(req.color() != null ? req.color() : "yellow");
        highlight.setPositionData(req.positionData());
        highlight.setChapterTitle(req.chapterTitle());

        return HighlightDto.from(highlightRepository.save(highlight));
    }

    public List<HighlightDto> getHighlights(Long bookId, Long userId) {
        requireOwnedBook(bookId, userId);
        return highlightRepository
                .findByBookIdAndUserIdOrderByCreatedAtDesc(bookId, userId)
                .stream()
                .map(HighlightDto::from)
                .toList();
    }

    @Transactional
    public void deleteHighlight(Long highlightId, Long userId) {
        Highlight highlight = highlightRepository.findByIdAndUserId(highlightId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Highlight not found."));
        if (!highlight.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You do not own this highlight.");
        }
        highlightRepository.delete(highlight);
    }

    // ── Bookmarks ──

    @Transactional
    public BookmarkDto createBookmark(Long bookId, Long userId, CreateBookmarkRequest req) {
        Book book = requireOwnedBook(bookId, userId);
        User user = requireUser(userId);

        Bookmark bookmark = new Bookmark();
        bookmark.setBook(book);
        bookmark.setUser(user);
        bookmark.setPageNumber(req.pageNumber());
        bookmark.setLabel(req.label());
        bookmark.setChapterTitle(req.chapterTitle());

        return BookmarkDto.from(bookmarkRepository.save(bookmark));
    }

    public List<BookmarkDto> getBookmarks(Long bookId, Long userId) {
        requireOwnedBook(bookId, userId);
        return bookmarkRepository
                .findByBookIdAndUserIdOrderByCreatedAtDesc(bookId, userId)
                .stream()
                .map(BookmarkDto::from)
                .toList();
    }

    @Transactional
    public void deleteBookmark(Long bookmarkId, Long userId) {
        Bookmark bookmark = bookmarkRepository.findByIdAndUserId(bookmarkId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Bookmark not found."));
        if (!bookmark.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You do not own this bookmark.");
        }
        bookmarkRepository.delete(bookmark);
    }

    // ── Combined annotations ──

    public List<AnnotationDto> getAllAnnotations(Long userId, Pageable pageable) {
        List<AnnotationDto> combined = new ArrayList<>();

        highlightRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(AnnotationDto::fromHighlight)
                .forEach(combined::add);

        bookmarkRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(AnnotationDto::fromBookmark)
                .forEach(combined::add);

        combined.sort(Comparator.comparing(AnnotationDto::createdAt).reversed());

        // Apply pagination manually
        int start = (int) pageable.getOffset();
        int end   = Math.min(start + pageable.getPageSize(), combined.size());
        if (start >= combined.size()) return List.of();
        return combined.subList(start, end);
    }

    public List<AnnotationDto> getBookAnnotations(Long bookId, Long userId) {
        requireOwnedBook(bookId, userId);

        List<AnnotationDto> combined = new ArrayList<>();

        highlightRepository.findByBookIdAndUserIdOrderByCreatedAtDesc(bookId, userId)
                .stream()
                .map(AnnotationDto::fromHighlight)
                .forEach(combined::add);

        bookmarkRepository.findByBookIdAndUserIdOrderByCreatedAtDesc(bookId, userId)
                .stream()
                .map(AnnotationDto::fromBookmark)
                .forEach(combined::add);

        combined.sort(Comparator.comparing(AnnotationDto::createdAt).reversed());
        return combined;
    }

    // ── Helpers ──

    private Book requireOwnedBook(Long bookId, Long userId) {
        return bookRepository.findByIdAndUserId(bookId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }
}
