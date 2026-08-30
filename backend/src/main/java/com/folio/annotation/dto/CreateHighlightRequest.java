package com.folio.annotation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateHighlightRequest(
        @NotNull @Min(1) Integer pageNumber,
        @NotBlank String selectedText,
        String color,
        String positionData,
        String chapterTitle
) {}
