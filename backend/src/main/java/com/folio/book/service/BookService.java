package com.folio.book.service;

import com.folio.auth.entity.User;
import com.folio.auth.repository.UserRepository;
import com.folio.book.dto.BookDto;
import com.folio.book.entity.Book;
import com.folio.book.repository.BookRepository;
import com.folio.common.DuplicateResourceException;
import com.folio.common.ResourceNotFoundException;
import com.folio.reading.entity.ReadingProgress;
import com.folio.reading.repository.ReadingProgressRepository;
import com.folio.annotation.repository.HighlightRepository;
import com.folio.annotation.repository.BookmarkRepository;
import com.folio.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ReadingProgressRepository progressRepository;
    private final HighlightRepository highlightRepository;
    private final BookmarkRepository bookmarkRepository;
    private final StorageService storageService;

    /** List books for a user, optionally searching by title/author. */
    public Page<BookDto> getBooks(Long userId, String search, int page, int size, String sort) {
        Sort sortSpec = switch (sort) {
            case "title"     -> Sort.by("title").ascending();
            case "author"    -> Sort.by("author").ascending();
            case "createdAt" -> Sort.by("createdAt").descending();
            default          -> Sort.by("createdAt").descending();
        };
        Pageable pageable = PageRequest.of(page, size, sortSpec);

        Page<Book> books = (search != null && !search.isBlank())
                ? bookRepository.searchByUser(userId, search, pageable)
                : bookRepository.findByUserId(userId, pageable);

        return books.map(b -> enrichWithProgress(b, userId));
    }

    /** Get a single book (verifying ownership). */
    public BookDto getBook(Long bookId, Long userId) {
        Book book = requireOwnedBook(bookId, userId);
        return enrichWithProgress(book, userId);
    }

    /** Upload and process a new PDF book. */
    @Transactional
    public BookDto upload(MultipartFile file, Long userId) throws IOException {
        validatePdf(file);

        // Compute file hash to detect duplicates
        String hash = computeSha256(file);
        if (bookRepository.findByFileHashAndUserId(hash, userId).isPresent()) {
            throw new DuplicateResourceException("You have already uploaded this book.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        // Store the PDF
        String safeFileName = sanitizeFileName(file.getOriginalFilename());
        String fileUrl = storageService.store(file, "books/" + userId, safeFileName);

        // Parse PDF metadata
        String title  = null;
        String author = null;
        int    pages  = 0;
        String coverUrl = null;

        try (PDDocument pdf = Loader.loadPDF(file.getBytes())) {
            pages = pdf.getNumberOfPages();
            PDDocumentInformation info = pdf.getDocumentInformation();
            if (info != null) {
                title  = info.getTitle();
                author = info.getAuthor();
            }

            // Generate cover from first page
            coverUrl = generateCover(pdf, userId, safeFileName);
        } catch (Exception ex) {
            log.warn("PDF processing error for {}: {}", safeFileName, ex.getMessage());
        }

        // Fallback title/author
        if (title  == null || title.isBlank())  title  = stripExtension(file.getOriginalFilename());
        if (author == null || author.isBlank()) author = "Unknown Author";

        Book book = Book.builder()
                .user(user)
                .title(title)
                .author(author)
                .fileUrl(fileUrl)
                .coverUrl(coverUrl)
                .fileName(safeFileName)
                .fileSize(file.getSize())
                .totalPages(pages > 0 ? pages : null)
                .fileHash(hash)
                .build();

        book = bookRepository.save(book);
        return BookDto.from(book);
    }

    /** Delete a book and all its associated data. */
    @Transactional
    public void deleteBook(Long bookId, Long userId) {
        Book book = requireOwnedBook(bookId, userId);

        highlightRepository.deleteByBookId(bookId);
        bookmarkRepository.deleteByBookId(bookId);
        progressRepository.deleteByBookId(bookId);

        storageService.delete(book.getFileUrl());
        storageService.delete(book.getCoverUrl());

        bookRepository.delete(book);
    }

    /** Verify ownership and return book, or throw. */
    public Book requireOwnedBook(Long bookId, Long userId) {
        return bookRepository.findByIdAndUserId(bookId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
    }

    /** Recently added books (up to 6) for home page. */
    public List<BookDto> getRecentlyAdded(Long userId) {
        return bookRepository.findTop6ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(b -> enrichWithProgress(b, userId))
                .toList();
    }

    // ── Helpers ──

    private BookDto enrichWithProgress(Book book, Long userId) {
        Optional<ReadingProgress> prog = progressRepository.findByUserIdAndBookId(userId, book.getId());
        BookDto.ProgressDto progressDto = prog.map(p -> {
            double pct = book.getTotalPages() != null && book.getTotalPages() > 0
                    ? Math.min(100.0, (double) p.getCurrentPage() / book.getTotalPages() * 100)
                    : 0.0;
            return new BookDto.ProgressDto(p.getCurrentPage(), Math.round(pct * 10.0) / 10.0);
        }).orElse(null);

        return BookDto.from(book, progressDto);
    }

    private String generateCover(PDDocument pdf, Long userId, String fileName) {
        try {
            PDFRenderer renderer = new PDFRenderer(pdf);
            BufferedImage img = renderer.renderImageWithDPI(0, 150);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(img, "PNG", out);
            String coverName = fileName.replaceAll("\\.pdf$", "") + "_cover.png";
            return storageService.storeBytes(out.toByteArray(), "covers/" + userId, coverName, "image/png");
        } catch (Exception ex) {
            log.warn("Cover generation failed: {}", ex.getMessage());
            return null;
        }
    }

    private String computeSha256(MultipartFile file) throws IOException {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            DigestInputStream dis = new DigestInputStream(file.getInputStream(), md);
            byte[] buf = new byte[8192];
            while (dis.read(buf) != -1) { /* consume */ }
            return HexFormat.of().formatHex(md.digest());
        } catch (Exception e) {
            throw new IOException("Failed to compute file hash", e);
        }
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("No file provided.");
        String ct = file.getContentType();
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!"application/pdf".equals(ct) && !name.endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are supported.");
        }
        if (file.getSize() > 150L * 1024 * 1024) {
            throw new IllegalArgumentException("File exceeds the 150 MB limit.");
        }
    }

    private String sanitizeFileName(String name) {
        if (name == null) return "book.pdf";
        return name.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
    }

    private String stripExtension(String name) {
        if (name == null) return "Untitled";
        return name.replaceAll("(?i)\\.pdf$", "").replace("_", " ").replace("-", " ");
    }
}
