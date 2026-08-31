package com.folio.common;

/**
 * Thrown when a user attempts to access a resource they do not own.
 * Distinct from Spring Security's AccessDeniedException so it is handled
 * by the GlobalExceptionHandler and returns a 403 JSON body.
 */
public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException(String message) {
        super(message);
    }
}
