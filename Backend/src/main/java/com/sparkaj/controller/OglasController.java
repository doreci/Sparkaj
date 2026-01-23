package com.sparkaj.controller;

import com.sparkaj.model.CreateOglasRequest;
import com.sparkaj.model.UpdateOglasRequest;
import com.sparkaj.model.FilterOglasBody;
import com.sparkaj.model.Oglas;
import com.sparkaj.model.Prijava;
import com.sparkaj.service.OglasService;
import com.sparkaj.service.KorisnikService;
import com.sparkaj.service.PrijavaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/oglasi")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "${api.url}", "https://sparkaj-g53p.onrender.com"})
public class OglasController {

    private final OglasService oglasService;
    private final KorisnikService korisnikService;
    private final PrijavaService prijavaService;

    public OglasController(OglasService oglasService, KorisnikService korisnikService, PrijavaService prijavaService) {
        this.oglasService = oglasService;
        this.korisnikService = korisnikService;
        this.prijavaService = prijavaService;
        System.out.println(" OglasController created");
    }

    // Dohvat svih oglasa
    @GetMapping
    public Mono<ResponseEntity<List<Oglas>>> getAllOglasi() {
        return oglasService.getAllOglasi()
                .map(ResponseEntity::ok);
    }
    
    @GetMapping("/{id}")
    public Mono<Oglas> getOglasById(@PathVariable Integer id) {
        return oglasService.getOglasById(id);
    }

    @PostMapping("/search")
    public Mono<ResponseEntity<List<Oglas>>> pretraziOglase(@RequestBody FilterOglasBody fob) {
        return oglasService.pretraziOglase(fob)
                .map(ResponseEntity::ok);
    }
    
    @PostMapping
    public Mono<ResponseEntity<Oglas>> kreirajOglas(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody CreateOglasRequest request) {
        System.out.println("[OglasController] POST /api/oglasi - Primljen zahtjev");
        System.out.println("[OglasController] Request body: " + request);
        
        if (principal != null) {
            String email = principal.getAttribute("email");
            System.out.println("[OglasController] Korisnik autentificiran, email: " + email);
            
            return korisnikService.getKorisnikByEmail(email)
                    .flatMap(korisnik -> {
                        if (korisnik != null) {
                            System.out.println("[OglasController] Pronađen korisnik sa ID: " + korisnik.getIdKorisnika());
                            request.setIdKorisnika(korisnik.getIdKorisnika());
                        }
                        return oglasService.createOglas(request);
                    })
                    .map(ResponseEntity::ok)
                    .onErrorResume(error -> {
                        System.err.println("[OglasController] ✗ Greška pri kreiranju oglasa: " + error.getMessage());
                        error.printStackTrace();
                        return Mono.just(ResponseEntity.status(500).build());
                    });
        } else {
            // Ako nema OAuth2 autentifikacije, koristi UUID iz requestа
            System.out.println("[OglasController] Nema OAuth2 autentifikacije, koristim UUID");
            return oglasService.createOglas(request)
                    .map(ResponseEntity::ok)
                    .onErrorResume(error -> {
                        System.err.println("[OglasController] ✗ Greška pri kreiranju oglasa: " + error.getMessage());
                        error.printStackTrace();
                        return Mono.just(ResponseEntity.status(500).build());
                    });
        }
    }
    
    @PutMapping("/{id}")
    public Mono<ResponseEntity<Object>> azurirajOglas(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody UpdateOglasRequest request) {
        System.out.println("[OglasController] PUT /api/oglasi/{id} - Ažuriram oglas: " + id);
        System.out.println("[OglasController] Request: " + request);
        
        if (principal == null) {
            System.err.println("[OglasController] ✗ Korisnik nije autentificiran");
            Map<String, String> error = new HashMap<>();
            error.put("error", "Korisnik nije autentificiran");
            return Mono.just(ResponseEntity.status(401).body((Object) error));
        }

        String email = principal.getAttribute("email");
        System.out.println("[OglasController] Email korisnika: " + email);

        return korisnikService.getKorisnikByEmail(email)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        System.err.println("[OglasController] ✗ Korisnik nije pronađen sa emailom: " + email);
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Korisnik nije pronađen");
                        return Mono.just(ResponseEntity.status(404).body((Object) error));
                    }
                    
                    System.out.println("[OglasController] Pronađen korisnik sa ID: " + korisnik.getIdKorisnika());
                    return oglasService.azurirajOglas(id.longValue(), request, korisnik.getIdKorisnika())
                            .map(result -> {
                                Map<String, Object> response = new HashMap<>();
                                response.put("success", true);
                                response.put("message", "Oglas je uspješno ažuriran");
                                response.put("oglas", result);
                                return ResponseEntity.ok((Object) response);
                            })
                            .onErrorResume(error -> {
                                System.err.println("[OglasController] ✗ Greška pri ažuriranju oglasa: " + error.getMessage());
                                Map<String, String> errorResponse = new HashMap<>();
                                errorResponse.put("error", error.getMessage());
                                return Mono.just(ResponseEntity.status(400).body((Object) errorResponse));
                            });
                })
                .onErrorResume(error -> {
                    System.err.println("[OglasController] ✗ Greška pri ažuriranju oglasa: " + error.getMessage());
                    error.printStackTrace();
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", error.getMessage());
                    return Mono.just(ResponseEntity.status(500).body((Object) errorResponse));
                });
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Object>> deleteOglas(
            @PathVariable Integer id,
            @AuthenticationPrincipal OAuth2User principal) {
        System.out.println("[OglasController] DELETE /api/oglasi/{id} - Brišem oglas: " + id);
        
        if (principal == null) {
            System.err.println("[OglasController] ✗ Korisnik nije autentificiran");
            Map<String, String> error = new HashMap<>();
            error.put("error", "Korisnik nije autentificiran");
            return Mono.just(ResponseEntity.status(401).body((Object) error));
        }

        String email = principal.getAttribute("email");
        System.out.println("[OglasController] Email korisnika: " + email);

        return korisnikService.getKorisnikByEmail(email)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        System.err.println("[OglasController] ✗ Korisnik nije pronađen sa emailom: " + email);
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Korisnik nije pronađen");
                        return Mono.just(ResponseEntity.status(404).body((Object) error));
                    }
                    
                    System.out.println("[OglasController] Pronađen korisnik sa ID: " + korisnik.getIdKorisnika());
                    return oglasService.obrisiOglas(id.longValue(), korisnik.getIdKorisnika())
                            .map(result -> {
                                Map<String, String> response = new HashMap<>();
                                response.put("message", "Oglas je uspješno obrisan");
                                return ResponseEntity.ok((Object) response);
                            })
                            .onErrorResume(error -> {
                                System.err.println("[OglasController] ✗ Greška pri brisanju oglasa: " + error.getMessage());
                                Map<String, String> errorResponse = new HashMap<>();
                                errorResponse.put("error", error.getMessage());
                                return Mono.just(ResponseEntity.status(400).body((Object) errorResponse));
                            });
                })
                .onErrorResume(error -> {
                    System.err.println("[OglasController] ✗ Greška pri brisanju oglasa: " + error.getMessage());
                    error.printStackTrace();
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", error.getMessage());
                    return Mono.just(ResponseEntity.status(500).body((Object) errorResponse));
                });
    }

    @PostMapping("/{id}/prijava")
    public Mono<ResponseEntity<Object>> prijaviOglas(
            @PathVariable Integer id,
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, String> body) {
        System.out.println("[OglasController] POST /api/oglasi/{id}/prijava - Primljen zahtjev za oglas: " + id);
        
        if (principal == null) {
            System.err.println("[OglasController] ✗ Korisnik nije autentificiran");
            Map<String, String> error = new HashMap<>();
            error.put("error", "Korisnik nije autentificiran");
            return Mono.just(ResponseEntity.status(401).body((Object) error));
        }

        String email = principal.getAttribute("email");
        String opis = body.get("opis");
        
        System.out.println("[OglasController] Email korisnika: " + email + ", opis: " + opis);

        return korisnikService.getKorisnikByEmail(email)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        System.err.println("[OglasController] ✗ Korisnik nije pronađen sa emailom: " + email);
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Korisnik nije pronađen");
                        return Mono.just(ResponseEntity.status(404).body((Object) error));
                    }
                    
                    System.out.println("[OglasController] Pronađen korisnik sa ID: " + korisnik.getIdKorisnika());
                    return prijavaService.kreirajPrijavu(korisnik.getIdKorisnika(), id, opis)
                            .map(prijava -> ResponseEntity.ok((Object) prijava));
                })
                .onErrorResume(error -> {
                    System.err.println("[OglasController] ✗ Greška pri slanju prijave: " + error.getMessage());
                    error.printStackTrace();
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", error.getMessage());
                    return Mono.just(ResponseEntity.status(500).body((Object) errorResponse));
                });
    }

    @GetMapping("/prijave/all")
    public Mono<ResponseEntity<List<Prijava>>> getAllPrijave() {
        System.out.println("[OglasController] GET /api/oglasi/prijave/all - Dohvaćam sve prijave");
        return prijavaService.getPrijave()
                .map(ResponseEntity::ok)
                .onErrorResume(error -> {
                    System.err.println("[OglasController] ✗ Greška pri dohvaćanju prijava: " + error.getMessage());
                    return Mono.just(ResponseEntity.status(500).build());
                });
    }

    @PutMapping("/prijave/{id}/status")
    public Mono<ResponseEntity<Object>> azurirajStatusPrijave(
            @PathVariable Integer id,
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody Map<String, Object> body) {
        System.out.println("[OglasController] PUT /api/oglasi/prijave/{id}/status - Ažuriram status prijave: " + id);
        
        if (principal == null) {
            System.err.println("[OglasController] ✗ Korisnik nije autentificiran");
            Map<String, String> error = new HashMap<>();
            error.put("error", "Korisnik nije autentificiran");
            return Mono.just(ResponseEntity.status(401).body((Object) error));
        }

        String email = principal.getAttribute("email");
        Object statusObj = body.get("status");
        
        if (statusObj == null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Status je obavezan");
            return Mono.just(ResponseEntity.status(400).body((Object) error));
        }
        
        final Boolean noviStatus;
        if (statusObj instanceof Boolean) {
            noviStatus = (Boolean) statusObj;
        } else if (statusObj instanceof String) {
            noviStatus = Boolean.parseBoolean((String) statusObj);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Neispravan format statusa");
            return Mono.just(ResponseEntity.status(400).body((Object) error));
        }
        
        System.out.println("[OglasController] Email: " + email + ", novi status: " + noviStatus);

        return korisnikService.getKorisnikByEmail(email)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        System.err.println("[OglasController] ✗ Korisnik nije pronađen sa emailom: " + email);
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Korisnik nije pronađen");
                        return Mono.just(ResponseEntity.status(404).body((Object) error));
                    }
                    
                    System.out.println("[OglasController] Pronađen korisnik sa ID: " + korisnik.getIdKorisnika());
                    return prijavaService.azurirajStatus(id, noviStatus)
                            .map(prijava -> ResponseEntity.ok((Object) prijava));
                })
                .onErrorResume(error -> {
                    System.err.println("[OglasController] ✗ Greška pri ažuriranju statusa: " + error.getMessage());
                    error.printStackTrace();
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", error.getMessage());
                    return Mono.just(ResponseEntity.status(500).body((Object) errorResponse));
                });
    }

    @PostMapping("/{id}/recenzija")
    public Mono<ResponseEntity<?>> submitReview(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal OAuth2User principal) {
        
        try {
            if (principal == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Niste ulogirani");
                return Mono.just(ResponseEntity.status(401).body((Object) error));
            }

            String email = principal.getAttribute("email");
            Long ocjena = ((Number) request.get("ocjena")).longValue();

            if (ocjena < 1 || ocjena > 5) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Ocjena mora biti između 1 i 5");
                return Mono.just(ResponseEntity.status(400).body((Object) error));
            }

            return korisnikService.getKorisnikByEmail(email)
                    .flatMap(korisnik -> {
                        if (korisnik == null) {
                            Map<String, String> error = new HashMap<>();
                            error.put("error", "Korisnik nije pronađen");
                            return Mono.just(ResponseEntity.status(404).body((Object) error));
                        }

                        // Provjerit ima li korisnik rezervaciju za oglas
                        return oglasService.findReservation(korisnik.getIdKorisnika(), id)
                                .flatMap(rezervacijaId -> {
                                    if (rezervacijaId == null) {
                                        Map<String, String> error = new HashMap<>();
                                        error.put("error", "Trebali ste prethodno rezervirati ovo parkiralište");
                                        return Mono.just(ResponseEntity.status(403).body((Object) error));
                                    }

                                    return oglasService.submitReview(rezervacijaId, ocjena)
                                            .map(result -> {
                                                Map<String, Object> response = new HashMap<>();
                                                response.put("success", true);
                                                response.put("message", "Recenzija uspješno sprema");
                                                return ResponseEntity.ok((Object) response);
                                            })
                                            .onErrorResume(error -> {
                                                Map<String, String> errorResponse = new HashMap<>();
                                                errorResponse.put("error", error.getMessage());
                                                return Mono.just(ResponseEntity.status(400).body((Object) errorResponse));
                                            });
                                });
                    });
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Greška pri spremanju recenzije: " + e.getMessage());
            return Mono.just(ResponseEntity.status(400).body((Object) error));
        }
    }
}