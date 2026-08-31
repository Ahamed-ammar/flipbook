package com.folio.home.controller;

import com.folio.book.dto.BookDto;
import com.folio.book.entity.Book;
import com.folio.book.repository.BookRepository;
import com.folio.book.service.BookService;
import com.folio.home.dto.HomeResponse;
import com.folio.reading.entity.ReadingProgress;
import com.folio.reading.repository.ReadingProgressRepository;
import com.folio.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {

    private final BookRepository bookRepository;
    private final ReadingProgressRepository progressRepository;
    private final BookService bookService;

    @GetMapping
    public ResponseEntity<HomeResponse> home(@CurrentUser Long userId) {
        // Top 3 recently read books (ordered by lastReadAt desc)
        List<BookDto> recentReading = progressRepository
                .findRecentByUserId(userId, PageRequest.of(0, 3))
                .stream()
                .map(ReadingProgress::getBook)
                .map(book -> buildBookDtoWithProgress(book, userId))
                .toList();

        // Top 6 recently added books
        List<BookDto> recentlyAdded = bookRepository
                .findTop6ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(book -> buildBookDtoWithProgress(book, userId))
                .toList();

        return ResponseEntity.ok(new HomeResponse(recentReading, recentlyAdded));
    }

    private BookDto buildBookDtoWithProgress(Book book, Long userId) {
        return bookService.getBook(book.getId(), userId);
    }
}
