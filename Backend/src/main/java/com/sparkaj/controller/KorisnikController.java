package com.sparkaj.controller;

import com.sparkaj.model.Korisnik;
import com.sparkaj.model.Oglas;
import com.sparkaj.model.UpdateProfileRequest;
import com.sparkaj.service.KorisnikService;
import com.sparkaj.service.OglasService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/korisnik")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:10000", "https://sparkaj-g53p.onrender.com"})
public class KorisnikController {

    private final KorisnikService korisnikService;
    private final OglasService oglasService;

    public KorisnikController(KorisnikService korisnikService, OglasService oglasService) {
        this.korisnikService = korisnikService;
        this.oglasService = oglasService;
        System.out.println("Napravljen Korisnik Controller");
    }

    // Prikaz profila korisnika po UUID
    @GetMapping("/uuid/{uuid}")
    public Mono<Korisnik> getKorisnikByUUID(@PathVariable String uuid) {
        return korisnikService.getKorisnikByUuid(uuid);
    }

    // Prikaz profila korisnika po ID
    @GetMapping("/{idKorisnika}")
    public Mono<Korisnik> getKorisnik(@PathVariable Integer idKorisnika) {
        return korisnikService.getKorisnikById(idKorisnika);
    }

    // Prikazi svih oglasa jednog korisnika
    @GetMapping("/{idKorisnika}/oglasi")
    public Mono<List<Oglas>> getOglasiKorisnika(@PathVariable Integer idKorisnika) {
        return oglasService.getOglasiByIdKorisnika(idKorisnika);
    }

    // Ažuriranje profila korisnika (bez slike)
    @PutMapping("/profile/update")
    public Mono<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody UpdateProfileRequest updateRequest) {
        
        if (principal == null) {
            return Mono.just(createErrorResponse("Korisnik nije autentificiran"));
        }

        String email = principal.getAttribute("email");
        return korisnikService.updateUserProfile(email, updateRequest)
                .then(Mono.just(createSuccessResponse("Profil uspješno ažuriran")))
                .onErrorResume(e -> Mono.just(createErrorResponse("Greška pri ažuriranju: " + e.getMessage())));
    }

    @PatchMapping("/{id}/blokiraj")
    public Mono<Korisnik> blokirajKorisnika(@PathVariable Integer id) {
        return korisnikService.blokirajKorisnika(id);
    }

    private Map<String, Object> createSuccessResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        return response;
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}