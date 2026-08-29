package com.folio.auth.dto;

import com.folio.auth.entity.User;

public record UserDto(Long id, String name, String email) {
    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail());
    }
}
