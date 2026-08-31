package com.folio.book.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;

@Slf4j
@Service
public class PdfProcessingService {

    /**
     * Extract metadata from a PDF file.
     *
     * @param pdfFile the PDF file on disk
     * @return map with keys: title, author, pageCount
     */
    public Map<String, Object> extractMetadata(File pdfFile) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("title", null);
        meta.put("author", null);
        meta.put("pageCount", 0);

        try (PDDocument doc = Loader.loadPDF(pdfFile)) {
            meta.put("pageCount", doc.getNumberOfPages());
            PDDocumentInformation info = doc.getDocumentInformation();
            if (info != null) {
                String title = info.getTitle();
                String author = info.getAuthor();
                meta.put("title",  (title  != null && !title.isBlank())  ? title.trim()  : null);
                meta.put("author", (author != null && !author.isBlank()) ? author.trim() : null);
            }
        } catch (IOException e) {
            log.warn("Failed to extract PDF metadata from {}: {}", pdfFile.getName(), e.getMessage());
        }

        return meta;
    }

    /**
     * Render the first page of a PDF to a JPEG cover image.
     *
     * @param pdfFile    the PDF file on disk
     * @param outputPath absolute path for the output JPEG file
     * @return the outputPath on success, or null on failure
     */
    public String generateCover(File pdfFile, String outputPath) {
        try (PDDocument doc = Loader.loadPDF(pdfFile)) {
            if (doc.getNumberOfPages() == 0) return null;

            PDFRenderer renderer = new PDFRenderer(doc);
            BufferedImage image = renderer.renderImageWithDPI(0, 150);

            Path out = Path.of(outputPath);
            Files.createDirectories(out.getParent());

            ImageIO.write(image, "JPEG", out.toFile());
            return outputPath;
        } catch (IOException e) {
            log.warn("Cover generation failed for {}: {}", pdfFile.getName(), e.getMessage());
            return null;
        }
    }

    /**
     * Compute the SHA-256 hash of the uploaded file content.
     *
     * @param file the multipart file
     * @return lowercase hex SHA-256 string
     */
    public String calculateHash(MultipartFile file) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            try (InputStream is = file.getInputStream();
                 DigestInputStream dis = new DigestInputStream(is, md)) {
                byte[] buffer = new byte[8192];
                while (dis.read(buffer) != -1) {
                    // consume stream to feed the digest
                }
            }
            return HexFormat.of().formatHex(md.digest());
        } catch (NoSuchAlgorithmException | IOException e) {
            throw new RuntimeException("Failed to compute file hash", e);
        }
    }
}
