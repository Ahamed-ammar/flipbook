package com.folio.security;

import com.folio.auth.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {

        final String token = resolveToken(request);

        if (StringUtils.hasText(token)) {
            try {
                if (jwtService.isValid(token) &&
                        SecurityContextHolder.getContext().getAuthentication() == null) {

                    Long userId = jwtService.extractUserId(token);
                    userRepository.findById(userId).ifPresent(user -> {
                        // Set the actual User entity as principal so @CurrentUser can extract the ID
                        UserDetails principal = buildPrincipal(userId);

                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(
                                        principal, null, principal.getAuthorities());
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
                }
            } catch (Exception ex) {
                log.warn("JWT filter error: {}", ex.getMessage());
            }
        }

        chain.doFilter(request, response);
    }

    /**
     * Extract the JWT from the Authorization header (Bearer) or the {@code token} query param.
     * The query param is used when the browser fetches the PDF directly via URL.
     */
    private String resolveToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        // Fallback: token query param (for direct PDF streaming)
        String tokenParam = request.getParameter("token");
        if (StringUtils.hasText(tokenParam)) {
            return tokenParam;
        }
        return null;
    }

    private org.springframework.security.core.userdetails.User buildPrincipal(Long userId) {
        return new org.springframework.security.core.userdetails.User(
                userId.toString(), "", java.util.List.of());
    }
}
