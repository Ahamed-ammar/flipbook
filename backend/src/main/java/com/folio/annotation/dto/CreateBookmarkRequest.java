package com.folio.annotation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateBookmarkRequest(
        @NotNull @Min(1) Integer pageNumber,
        String label,
        String chapterTitle
) {}
