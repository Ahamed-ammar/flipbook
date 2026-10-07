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
import java.io.InputStream;
import java.nio.file.*;
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

    /**
     * Upload and process a new PDF book.
     *
     * Strategy: stream the file to a temp file on disk first, then process
     * from disk. This avoids loading the entire PDF into heap memory, which
     * would OOM-crash the JVM for files > ~20 MB.
     */
    @Transactional
    public BookDto upload(MultipartFile file, String titleParam, String authorParam, Long userId) throws IOException {
        validatePdf(file);

        // 1. Stream to a temp file — never load the whole PDF into heap
        Path tempFile = Files.createTempFile("folio-upload-", ".pdf");
        try {
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // 2. Hash from the temp file (streaming, no heap copy)
            String hash = computeSha256FromPath(tempFile);
            if (bookRepository.findByFileHashAndUserId(hash, userId).isPresent()) {
                throw new DuplicateResourceException("You have already uploaded this book.");
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found."));

            // 3. Store to permanent storage by streaming from temp file
            String safeFileName = sanitizeFileName(file.getOriginalFilename());
            String fileUrl = storageService.storeFromPath(tempFile, "books/" + userId, safeFileName);

            // 4. Parse PDF metadata + generate cover (PDFBox loads from file, not bytes)
            String title    = null;
            String author   = null;
            int    pages    = 0;
            String coverUrl = null;

            try (PDDocument pdf = Loader.loadPDF(tempFile.toFile())) {
                pages = pdf.getNumberOfPages();
                PDDocumentInformation info = pdf.getDocumentInformation();
                if (info != null) {
                    title  = info.getTitle();
                    author = info.getAuthor();
                }
                coverUrl = generateCover(pdf, userId, safeFileName);
            } catch (Exception ex) {
                log.warn("PDF processing error for {}: {}", safeFileName, ex.getMessage());
            }

            // 5. User-provided values override PDF metadata
            if (titleParam  != null && !titleParam.isBlank())  title  = titleParam.trim();
            if (authorParam != null && !authorParam.isBlank()) author = authorParam.trim();

            if (title  == null || title.isBlank())  title  = stripExtension(file.getOriginalFilename());
            if (author == null || author.isBlank()) author = "Unknown Author";

            Book book = Book.builder()
                    .user(user)
                    .title(title)
                    .author(author)
                    .fileUrl(fileUrl)
                    .coverUrl(coverUrl)
                    .fileName(safeFileName)
                    .fileSize(Files.size(tempFile))
                    .totalPages(pages > 0 ? pages : null)
                    .fileHash(hash)
                    .build();

            book = bookRepository.save(book);
            return BookDto.from(book);

        } finally {
            // Always clean up the temp file
            Files.deleteIfExists(tempFile);
        }
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

    // ── Helpers ──────────────────────────────────────────────────────────────

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
            // Render at 120 DPI instead of 150 — smaller memory footprint for large pages
            BufferedImage img = renderer.renderImageWithDPI(0, 120);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(img, "JPEG", out);   // JPEG is much smaller than PNG
            String coverName = fileName.replaceAll("(?i)\\.pdf$", "") + "_cover.jpg";
            return storageService.storeBytes(out.toByteArray(), "covers/" + userId, coverName, "image/jpeg");
        } catch (Exception ex) {
            log.warn("Cover generation failed: {}", ex.getMessage());
            return null;
        }
    }

    /** Hash a file on disk by streaming — no heap copy. */
    private String computeSha256FromPath(Path path) throws IOException {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            try (InputStream is = Files.newInputStream(path);
                 DigestInputStream dis = new DigestInputStream(is, md)) {
                byte[] buf = new byte[8192];
                while (dis.read(buf) != -1) { /* consume */ }
            }
            return HexFormat.of().formatHex(md.digest());
        } catch (Exception e) {
            throw new IOException("Failed to compute file hash", e);
        }
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("No file provided.");
        String ct   = file.getContentType();
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
