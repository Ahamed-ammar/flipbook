package com.folio.storage;

import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.nio.file.Path;

public interface StorageService {
    /** Store a file and return its relative URL path. */
    String store(MultipartFile file, String subDir, String fileName);

    /** Store raw bytes and return relative URL path. */
    String storeBytes(byte[] bytes, String subDir, String fileName, String contentType);

    /** Resolve a stored URL/path to an absolute filesystem Path. */
    Path resolve(String url);

    /** Delete a stored file by its URL. */
    void delete(String url);
}
