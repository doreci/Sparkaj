package com.sparkaj.security;

import com.sparkaj.service.KorisnikService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private KorisnikService korisnikService;

    @Value("${oauth2.success-url:http://localhost:10000}")
    private String successUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        
        System.out.println("=== OAuth2SuccessHandler.onAuthenticationSuccess - POČETO ===");
        
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        
        // Izvuci podatke iz OAuth2 providera (Google)
        String email = oauth2User.getAttribute("email");
        String ime = oauth2User.getAttribute("given_name");
        String prezime = oauth2User.getAttribute("family_name");
        String profilna = oauth2User.getAttribute("picture");
        String googleId = oauth2User.getAttribute("sub");
        
        // System.out.println("=== OAuth2 Login Success ===");
        // System.out.println("Email: " + email);
        // System.out.println("Ime: " + ime);
        // System.out.println("Prezime: " + prezime);
        // System.out.println("Google ID: " + googleId);
        
        try {
            // - Ako korisnik ne postoji, kreiraj ga
            // - Ako postoji, ažuriraj UUID ako se razlikuje
            korisnikService.saveOrUpdateOAuth2Korisnik(email, ime, prezime, profilna, googleId)
                    .block(java.time.Duration.ofSeconds(10));
        } catch (Exception e) {
            System.err.println("GREŠKA pri upravljanju korisnikom: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Preusmjeravanje na frontend
        response.sendRedirect(successUrl);
    }
}
