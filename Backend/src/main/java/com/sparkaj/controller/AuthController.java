package com.sparkaj.controller;

import com.sparkaj.model.Korisnik;
import com.sparkaj.service.KorisnikService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:10000", "https://sparkaj-g53p.onrender.com"})
public class AuthController {

    @Autowired
    private KorisnikService korisnikService;

    @GetMapping("/user")
    public Map<String, Object> getUser(@AuthenticationPrincipal OAuth2User principal) {
        Map<String, Object> response = new HashMap<>();
        
        if (principal != null) {
            response.put("authenticated", true);
            response.put("email", principal.getAttribute("email"));
            response.put("name", principal.getAttribute("name"));
            response.put("given_name", principal.getAttribute("given_name"));
            response.put("family_name", principal.getAttribute("family_name"));
            response.put("picture", principal.getAttribute("picture"));
            
            // Pronađi korisnika po emailu i dodaj id_korisnika
            try {
                String email = principal.getAttribute("email");
                Korisnik korisnik = korisnikService.getKorisnikByEmail(email).block();
                if (korisnik != null) {
                    response.put("id_korisnika", korisnik.getIdKorisnika());
                    response.put("uuid", korisnik.getUuid());
                }
            } catch (Exception e) {
                System.err.println("[AuthController] Greška pri pronalaženju korisnika: " + e.getMessage());
            }
            
            return response;
        }
        
        response.put("authenticated", false);
        return response;
    }

    @GetMapping("/logout-success")
    public Map<String, String> logoutSuccess() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Uspješno ste se odjavili");
        return response;
    }
}