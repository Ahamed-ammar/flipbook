package com.folio.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.*;

@Slf4j
@Service
public class LocalStorageService implements StorageService {

    private final Path basePath;

    public LocalStorageService(@Value("${folio.storage.local-path:./uploads}") String storagePath) {
        this.basePath = Paths.get(storagePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(basePath);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create storage directory: " + basePath, e);
        }
    }

    @Override
    public String store(MultipartFile file, String subDir, String fileName) {
        try {
            Path dir  = basePath.resolve(subDir);
            Files.createDirectories(dir);
            Path dest = dir.resolve(fileName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            return "/files/" + subDir + "/" + fileName;
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store file: " + fileName, e);
        }
    }

    @Override
    public String storeBytes(byte[] bytes, String subDir, String fileName, String contentType) {
        try {
            Path dir  = basePath.resolve(subDir);
            Files.createDirectories(dir);
            Path dest = dir.resolve(fileName);
            Files.write(dest, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            return "/files/" + subDir + "/" + fileName;
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store bytes: " + fileName, e);
        }
    }

    @Override
    public Path resolve(String url) {
        // url is like /files/books/{userId}/{file}
        String relative = url.replaceFirst("^/files/", "");
        return basePath.resolve(relative).normalize();
    }

    @Override
    public void delete(String url) {
        if (url == null) return;
        try {
            Path file = resolve(url);
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Failed to delete file {}: {}", url, e.getMessage());
        }
    }
}
