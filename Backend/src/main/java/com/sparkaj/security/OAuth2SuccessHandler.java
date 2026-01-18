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
        
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        
        // Izvucite podatke iz OAuth2 providera (Google)
        String email = oauth2User.getAttribute("email");
        String ime = oauth2User.getAttribute("given_name");
        String prezime = oauth2User.getAttribute("family_name");
        String profilna = oauth2User.getAttribute("picture");
        String googleId = oauth2User.getAttribute("sub"); // Google user ID
        
        System.out.println("=== OAuth2 Login Success ===");
        System.out.println("Email: " + email);
        System.out.println("Ime: " + ime);
        System.out.println("Prezime: " + prezime);
        System.out.println("Google ID: " + googleId);
        
        try {
            // Provjeri postoji li korisnik u bazi
            // Ako postoji - ne ažuriraj ga (čuva se editirane podatke)
            // Ako ne postoji - kreiraj ga sa OAuth2 podacima
            com.sparkaj.model.Korisnik existingUser = korisnikService.getKorisnikByEmail(email)
                    .block(java.time.Duration.ofSeconds(5));
            
            if (existingUser != null) {
                // Korisnik postoji - ne ažuriraj ga
                System.out.println("✓ Korisnik već postoji u bazi, ne ažuriram ga");
            } else {
                // Korisnik ne postoji - kreiraj ga
                System.out.println("ℹ Korisnik ne postoji u bazi, kreiramo novog");
                korisnikService.saveOrUpdateOAuth2Korisnik(email, ime, prezime, profilna, googleId)
                        .block();
                System.out.println("✓ Novi korisnik kreiran: " + email);
            }
        } catch (Exception e) {
            System.err.println("✗ Greška pri provjeri korisnika: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Preusmjeravanje na frontend
        System.out.println("Preusmjeravanje na: " + successUrl);
        response.sendRedirect(successUrl);
    }
}
