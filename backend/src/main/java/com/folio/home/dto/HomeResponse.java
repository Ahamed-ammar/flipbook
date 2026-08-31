package com.folio.home.dto;

import com.folio.book.dto.BookDto;

import java.util.List;

public record HomeResponse(
        List<BookDto> recentReading,
        List<BookDto> recentlyAdded
) {}
