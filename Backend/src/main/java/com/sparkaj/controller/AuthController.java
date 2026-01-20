package com.sparkaj.controller;

import com.sparkaj.model.Korisnik;
import com.sparkaj.service.KorisnikService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
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
            String email = principal.getAttribute("email");
            response.put("authenticated", true);
            response.put("email", email);
            
            // Pronađi korisnika u bazi po emailu
            try {
                Korisnik korisnik = korisnikService.getKorisnikByEmail(email).block();
                if (korisnik != null) {
                    // Vrati podatke iz baze
                    System.out.println("[AuthController] Pronađen korisnik u bazi, vraćam podatke iz baze");
                    response.put("id_korisnika", korisnik.getIdKorisnika());
                    response.put("uuid", korisnik.getUuid());
                    response.put("given_name", korisnik.getIme());
                    response.put("family_name", korisnik.getPrezime());
                    response.put("picture", korisnik.getProfilna());
                    response.put("broj_mobitela", korisnik.getBrojMobitela());
                    response.put("oglasivac", korisnik.getOglasivac());
                    response.put("blokiran", korisnik.getBlokiran());
                } else {
                    // Ako nema u bazi, vrati OAuth2 podatke kao fallback
                    System.out.println("[AuthController] Korisnik nije pronađen u bazi, vraćam OAuth2 podatke");
                    response.put("given_name", principal.getAttribute("given_name"));
                    response.put("family_name", principal.getAttribute("family_name"));
                    response.put("picture", principal.getAttribute("picture"));
                    response.put("name", principal.getAttribute("name"));
                }
            } catch (Exception e) {
                System.err.println("[AuthController] Greška pri pronalaženju korisnika: " + e.getMessage());
                // Ako greška, vrati OAuth2 podatke
                response.put("given_name", principal.getAttribute("given_name"));
                response.put("family_name", principal.getAttribute("family_name"));
                response.put("picture", principal.getAttribute("picture"));
                response.put("name", principal.getAttribute("name"));
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

    @PutMapping("/user/request-advertiser")
    public Mono<Map<String, Object>> requestAdvertiser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Korisnik nije autentificiran");
            return Mono.just(error);
        }

        String email = principal.getAttribute("email");
        System.out.println("[AuthController] Zahtjev za oglašivanje od: " + email);

        return korisnikService.requestAdvertiser(email)
                .map(korisnik -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("authenticated", true);
                    response.put("email", korisnik.getEmail());
                    response.put("id_korisnika", korisnik.getIdKorisnika());
                    response.put("uuid", korisnik.getUuid());
                    response.put("given_name", korisnik.getIme());
                    response.put("family_name", korisnik.getPrezime());
                    response.put("picture", korisnik.getProfilna());
                    response.put("oglasivac", korisnik.getOglasivac());
                    response.put("blokiran", korisnik.getBlokiran());
                    return response;
                })
                .onErrorResume(error -> {
                    System.err.println("[AuthController] Greška pri zahtjevu: " + error.getMessage());
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", error.getMessage());
                    return Mono.just(errorResponse);
                });
    }

    @GetMapping("/admin/pending-advertisers")
    public Mono<Map<String, Object>> getPendingAdvertisers() {
        System.out.println("[AuthController] Dohvaćam sve zahtjeve za oglašivanje");
        
        return korisnikService.getPendingAdvertiserRequests()
                .map(korisnici -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("zahtjevi", korisnici);
                    return response;
                })
                .onErrorResume(error -> {
                    System.err.println("[AuthController] Greška pri dohvaćanju zahtjeva: " + error.getMessage());
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", error.getMessage());
                    return Mono.just(errorResponse);
                });
    }

    @PutMapping("/admin/approve-advertiser/{id}")
    public Mono<Map<String, Object>> approveAdvertiser(@PathVariable Integer id) {
        System.out.println("[AuthController] Odobravanje zahtjeva za ID: " + id);
        
        return korisnikService.approveAdvertiserRequest(id)
                .map(korisnik -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("korisnik", korisnik);
                    return response;
                })
                .onErrorResume(error -> {
                    System.err.println("[AuthController] Greška pri odobravanju: " + error.getMessage());
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", error.getMessage());
                    return Mono.just(errorResponse);
                });
    }

    @PutMapping("/admin/reject-advertiser/{id}")
    public Mono<Map<String, Object>> rejectAdvertiser(@PathVariable Integer id) {
        System.out.println("[AuthController] Odbijanje zahtjeva za ID: " + id);
        
        return korisnikService.rejectAdvertiserRequest(id)
                .map(korisnik -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("korisnik", korisnik);
                    return response;
                })
                .onErrorResume(error -> {
                    System.err.println("[AuthController] Greška pri odbijanju: " + error.getMessage());
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", error.getMessage());
                    return Mono.just(errorResponse);
                });
    }
}