package com.sparkaj.controller;

import com.sparkaj.model.Recenzija;
import com.sparkaj.service.RecenzijaService;
import com.sparkaj.service.KorisnikService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/recenzije")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "${api.url}", "https://sparkaj-g53p.onrender.com"})


public class RecenzijaController {

    private final RecenzijaService recenzijaService;
    private final KorisnikService korisnikService;

    public RecenzijaController(RecenzijaService recenzijaService, KorisnikService korisnikService) {
        this.recenzijaService = recenzijaService;
        this.korisnikService = korisnikService;
    }

    @GetMapping("/korisnik/{idKorisnika}")
    public Mono<List<Recenzija>> getRecenzijeByIdKorisnika(
            @PathVariable Integer idKorisnika,
            @AuthenticationPrincipal OAuth2User principal) {
        
        if (principal == null) {
            return Mono.just(new ArrayList<>());
        }

        String email = principal.getAttribute("email");
        
        return korisnikService.getKorisnikByEmail(email)
                .flatMap(currentUser -> {
                    if (currentUser == null || currentUser.getIdKorisnika() != idKorisnika) {
                        return Mono.just(new ArrayList<>());
                    }
                    return recenzijaService.getRecenzijeByIdKorisnika(idKorisnika)
                            .defaultIfEmpty(new ArrayList<>());
                });
    }

    @GetMapping("/korisnik/current")
    public Mono<List<Recenzija>> getRecenzijeByCurrentUser(
            @AuthenticationPrincipal OAuth2User principal) {
        
        if (principal == null) {
            return Mono.just(new ArrayList<>());
        }

        String email = principal.getAttribute("email");
        
        return korisnikService.getKorisnikByEmail(email)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        return Mono.just(new ArrayList<>());
                    }
                    return recenzijaService.getRecenzijeByIdKorisnika((Integer) korisnik.getIdKorisnika())
                            .defaultIfEmpty(new ArrayList<>());
                });
    }
}