package com.sparkaj.config;

import com.sparkaj.security.OAuth2SuccessHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private OAuth2SuccessHandler oauth2SuccessHandler;

    @Value("${api.url:http://localhost:10000}")
    private String apiUrl;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // System.out.println("[SecurityConfig] Konfiguriranje OAuth2...");
        return http
                .csrf(csrf -> csrf.disable())
                .cors(withDefaults())
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/").permitAll();
                    auth.requestMatchers("/favicon.ico").permitAll();
                    auth.requestMatchers("/api/public/**").permitAll();
                    auth.requestMatchers("/api/oglasi/**").permitAll();
                    auth.requestMatchers("/api/payments/**").permitAll();
                    auth.requestMatchers("/api/user").permitAll();
                    auth.requestMatchers("/api/logout-success").permitAll();
                    auth.requestMatchers("/login/**").permitAll();
                    auth.requestMatchers("/oauth2/**").permitAll();
                    auth.anyRequest().authenticated();
                })
                .oauth2Login(oauth2 -> {
                    // System.out.println("[SecurityConfig] OAuth2 Login Handler je: " + oauth2SuccessHandler);
                    oauth2.successHandler(oauth2SuccessHandler)
                    .failureUrl("/login?error=true");
                })
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl(apiUrl)
                        .clearAuthentication(true)
                        .invalidateHttpSession(true)
                )
                .build();
    }

    @Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(apiUrl, "https://sparkaj-g53p.onrender.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}

}