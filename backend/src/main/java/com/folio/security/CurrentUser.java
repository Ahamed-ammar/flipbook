package com.folio.security;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.lang.annotation.*;

/**
 * Convenience annotation that resolves the authenticated user's ID from the JWT principal.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal(expression = "#this == 'anonymousUser' ? null : Long.parseLong(name)")
public @interface CurrentUser {}
