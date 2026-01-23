package com.sparkaj.controller;

import com.sparkaj.model.Rezervacija;
import com.sparkaj.service.RezervacijaService;
import com.sparkaj.service.KorisnikService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "${api.url}", "https://sparkaj-g53p.onrender.com"})
public class RezervacijaController {

    private final RezervacijaService rezervacijaService;
    private final KorisnikService korisnikService;

    public RezervacijaController(RezervacijaService rezervacijaService, KorisnikService korisnikService) {
        this.rezervacijaService = rezervacijaService;
        this.korisnikService = korisnikService;
    }

    private LocalDateTime parseISODateTime(String dateString) {
        String dateToParse = dateString.replace("Z", "").replace("+00:00", "");
        dateToParse = dateToParse.replaceAll("\\.\\d{3}$", "");
        return LocalDateTime.parse(dateToParse);
    }

    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> createReservation(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal OAuth2User principal) {

        try {
            if (principal == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("error", "Unauthorized");
                return Mono.just(ResponseEntity.status(401).body(response));
            }

            String email = principal.getAttribute("email");
            
            return korisnikService.getKorisnikByEmail(email)
                    .flatMap(korisnik -> {
                        if (korisnik == null) {
                            Map<String, Object> response = new HashMap<>();
                            response.put("error", "User not found");
                            return Mono.just(ResponseEntity.status(401).body(response));
                        }

                        try {
                            Long oglasId = ((Number) request.get("id_oglasa")).longValue();
                            LocalDateTime datumOd = parseISODateTime((String) request.get("datumOd"));
                            LocalDateTime datumDo = parseISODateTime((String) request.get("datumDo"));

                            return rezervacijaService.createRezervacijaWithDetails((long) korisnik.getIdKorisnika(), oglasId, datumOd, datumDo)
                                    .map(created -> {
                                        Map<String, Object> response = new HashMap<>();
                                        response.put("success", true);
                                        response.put("message", "Rezervacija uspješno kreirana");
                                        response.put("reservation", created);
                                        return ResponseEntity.ok(response);
                                    })
                                    .onErrorResume(error -> {
                                        Map<String, Object> response = new HashMap<>();
                                        response.put("success", false);
                                        response.put("error", error.getMessage());
                                        return Mono.just(ResponseEntity.status(400).body(response));
                                    });
                        } catch (Exception e) {
                            Map<String, Object> response = new HashMap<>();
                            response.put("success", false);
                            response.put("error", "Invalid request: " + e.getMessage());
                            return Mono.just(ResponseEntity.status(400).body(response));
                        }
                    });

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Invalid request: " + e.getMessage());
            return Mono.just(ResponseEntity.status(400).body(response));
        }
    }

    @PostMapping("/batch")
    public Mono<ResponseEntity<Map<String, Object>>> createBatchReservations(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal OAuth2User principal) {

        try {
            if (principal == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("error", "Unauthorized");
                return Mono.just(ResponseEntity.status(401).body(response));
            }

            String email = principal.getAttribute("email");

            return korisnikService.getKorisnikByEmail(email)
                    .flatMap(korisnik -> {
                        if (korisnik == null) {
                            Map<String, Object> response = new HashMap<>();
                            response.put("error", "User not found");
                            return Mono.just(ResponseEntity.status(401).body(response));
                        }

                        try {
                            Long oglasId = ((Number) request.get("id_oglasa")).longValue();
                            
                            @SuppressWarnings("unchecked")
                            List<Map<String, String>> slots = (List<Map<String, String>>) request.get("slots");

                            List<Mono<Rezervacija>> reservationMonos = new ArrayList<>();

                            for (Map<String, String> slot : slots) {
                                LocalDateTime datumOd = parseISODateTime(slot.get("datumOd"));
                                LocalDateTime datumDo = parseISODateTime(slot.get("datumDo"));

                                reservationMonos.add(
                                        rezervacijaService.createRezervacijaWithDetails((long) korisnik.getIdKorisnika(), oglasId, datumOd, datumDo)
                                );
                            }

                            return reactor.core.publisher.Flux.fromIterable(reservationMonos)
                                    .flatMap(mono -> mono)
                                    .collectList()
                                    .map(results -> {
                                        Map<String, Object> response = new HashMap<>();
                                        response.put("success", true);
                                        response.put("message", "Sve rezervacije su uspješno kreirane");
                                        response.put("count", (long) results.size());
                                        return ResponseEntity.ok(response);
                                    })
                                    .onErrorResume(error -> {
                                        Map<String, Object> response = new HashMap<>();
                                        response.put("success", false);
                                        response.put("error", "Greška pri kreiranju rezervacija: " + error.getMessage());
                                        return Mono.just(ResponseEntity.status(400).body(response));
                                    });

                        } catch (Exception e) {
                            Map<String, Object> response = new HashMap<>();
                            response.put("success", false);
                            response.put("error", "Invalid request: " + e.getMessage());
                            return Mono.just(ResponseEntity.status(400).body(response));
                        }
                    });

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Invalid request: " + e.getMessage());
            return Mono.just(ResponseEntity.status(400).body(response));
        }
    }

    @GetMapping("/korisnik")
    public Mono<ResponseEntity<List<Rezervacija>>> getRezervacijeByCurrentUser(
            @AuthenticationPrincipal OAuth2User principal) {
        
        if (principal == null) {
            return Mono.just(ResponseEntity.status(401).body(new ArrayList<>()));
        }

        String email = principal.getAttribute("email");
        
        return korisnikService.getKorisnikByEmail(email)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        return Mono.just(ResponseEntity.status(401).body(new ArrayList<>()));
                    }
                    return rezervacijaService.getRezervacijeByIdKorisnika((long) korisnik.getIdKorisnika())
                            .map(ResponseEntity::ok)
                            .defaultIfEmpty(ResponseEntity.ok(new ArrayList<>()));
                });
    }
}
