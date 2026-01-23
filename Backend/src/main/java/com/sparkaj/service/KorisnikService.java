package com.sparkaj.service;

import com.sparkaj.model.Korisnik;
import com.sparkaj.model.Rezervacija;
import com.sparkaj.model.UpdateProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import reactor.core.publisher.Mono;

import java.util.*;

@Service
public class KorisnikService {

    private final WebClient webClient;

    public KorisnikService(WebClient webClient) {
        this.webClient = webClient;
    }

    // Salje upit Supabase-u, natrag dobiva podatke o korisniku
    public Mono<Korisnik> getKorisnikByUuid(String uuid) {
        return webClient.get()
                .uri("/rest/v1/korisnik?uuid=eq." + uuid + "&select=*")
                .retrieve()
                .bodyToMono(Korisnik[].class)
                .doOnNext(korisnici -> {
                    if (korisnici != null && korisnici.length > 0) {
                        System.out.println("[getKorisnikByUuid] Pronađen korisnik: ID=" + korisnici[0].getIdKorisnika() + ", Email=" + korisnici[0].getEmail());
                    } else {
                        System.out.println("[getKorisnikByUuid] Korisnik nije pronađen za UUID: " + uuid);
                    }
                })
                .map(korisnici -> korisnici.length > 0 ? korisnici[0] : null)
                .doOnError(error -> System.err.println("[getKorisnikByUuid] ✗ Greška: " + error.getMessage()));
    }

    public Mono<Korisnik> getKorisnikById(Integer idKorisnika) {
        return webClient.get()
                .uri("/rest/v1/korisnik?id_korisnika=eq." + idKorisnika + "&select=*")
                .retrieve()
                .bodyToMono(Korisnik[].class)
                .map(korisnici -> korisnici.length > 0 ? korisnici[0] : null);
    }

    // OAuth2 metode
    public Mono<Void> saveOrUpdateOAuth2Korisnik(String email, String ime, String prezime, String profilna, String uuid) {
        
        return getKorisnikByEmail(email)
                .hasElement()
                .flatMap(korisnikPostoji -> {
                    if (korisnikPostoji) {
                        // Korisnik postoji - ažuriraj UUID ako se razlikuje
                        return getKorisnikByEmail(email)
                                .flatMap(korisnik -> {
                                    // System.out.println("[KorisnikService.saveOrUpdateOAuth2Korisnik] Korisnik postoji");
                                    // System.out.println("[KorisnikService.saveOrUpdateOAuth2Korisnik] Postojeći UUID: " + korisnik.getUuid());
                                    // System.out.println("[KorisnikService.saveOrUpdateOAuth2Korisnik] Novi UUID: " + uuid);
                                    
                                    if (uuid != null && (korisnik.getUuid() == null || !uuid.equals(korisnik.getUuid()))) {
                                        return updateKorisnikUuid(email, uuid);
                                    }
                                    return Mono.empty();
                                });
                    } else {
                        // Korisnik ne postoji - kreiraj novog
                        return createOAuth2Korisnik(email, ime, prezime, profilna, uuid);
                    }
                })
                .then()
                .doOnSuccess(v -> System.out.println("[KorisnikService.saveOrUpdateOAuth2Korisnik] USPJEŠNO ZAVRŠENO"))
                .doOnError(e -> System.err.println("[KorisnikService.saveOrUpdateOAuth2Korisnik] GREŠKA: " + e.getMessage()))
                .onErrorResume(throwable -> {
                    System.err.println("[KorisnikService.saveOrUpdateOAuth2Korisnik] Error resume: " + throwable.getMessage());
                    throwable.printStackTrace();
                    return Mono.empty();
                });
    }

    public Mono<Korisnik> getKorisnikByEmail(String email) {
        return webClient.get()
                .uri("/rest/v1/korisnik?email=eq." + email + "&select=*")
                .retrieve()
                .bodyToMono(Korisnik[].class)
                .flatMap(korisnici -> {
                    if (korisnici != null && korisnici.length > 0) {
                        return Mono.just(korisnici[0]);
                    }
                    return Mono.empty();
                })
                .onErrorResume(e -> {
                    System.err.println("[getKorisnikByEmail] Greška: " + e.getMessage());
                    return Mono.empty();
                });
    }

    private Mono<Void> updateKorisnik(String email, String ime, String prezime, String profilna, String uuid) {
        Map<String, Object> updates = new HashMap<>();
        if (ime != null) updates.put("ime", ime);
        if (prezime != null) updates.put("prezime", prezime);
        if (profilna != null) updates.put("profilna", profilna);
        if (uuid != null) updates.put("uuid", uuid);
        
        return webClient.patch()
                .uri("/rest/v1/korisnik?email=eq." + email)
                .bodyValue(updates)
                .retrieve()
                .toBodilessEntity()
                .doOnSuccess(r -> System.out.println("[updateKorisnik] Korisnik ažuriran: " + email))
                .doOnError(e -> System.err.println("[updateKorisnik] Greška pri ažuriranju: " + e.getMessage()))
                .then();
    }

    private Mono<Void> createOAuth2Korisnik(String email, String ime, String prezime, String profilna, String uuid) {
        Map<String, Object> newKorisnik = new HashMap<>();
        newKorisnik.put("email", email);
        newKorisnik.put("ime", ime != null ? ime : "");
        newKorisnik.put("prezime", prezime != null ? prezime : "");
        newKorisnik.put("profilna", profilna != null ? profilna : "");
        newKorisnik.put("uuid", uuid != null ? uuid : UUID.randomUUID().toString());
        newKorisnik.put("oglasivac", "NE");
        newKorisnik.put("blokiran", false);
        
        return webClient.post()
                .uri("/rest/v1/korisnik")
                .bodyValue(newKorisnik)
                .retrieve()
                .toBodilessEntity()
                .doOnSuccess(r -> System.out.println("[createOAuth2Korisnik] Novi korisnik kreiran: " + email))
                .doOnError(e -> System.err.println("[createOAuth2Korisnik] Greška pri kreiranju: " + e.getMessage()))
                .then();
    }

    // Ažuriranje profila korisnika
    public Mono<Void> updateUserProfile(String email, UpdateProfileRequest updateRequest) {
        
        Map<String, Object> updates = new HashMap<>();
        if (updateRequest.getIme() != null && !updateRequest.getIme().isEmpty()) {
            updates.put("ime", updateRequest.getIme());
        }
        if (updateRequest.getPrezime() != null && !updateRequest.getPrezime().isEmpty()) {
            updates.put("prezime", updateRequest.getPrezime());
        }
        // Za broj mobitela: ako je prazan string, postavi na null; inače postavi vrijednost
        if (updateRequest.getBrojMobitela() != null) {
            if (updateRequest.getBrojMobitela().isEmpty()) {
                updates.put("broj_mobitela", null);
            } else {
                updates.put("broj_mobitela", updateRequest.getBrojMobitela());
            }
        }
        if (updateRequest.getProfileImageUrl() != null && !updateRequest.getProfileImageUrl().isEmpty()) {
            updates.put("profilna", updateRequest.getProfileImageUrl());
        }


        return webClient.patch()
                .uri("/rest/v1/korisnik?email=eq." + email)
                .bodyValue(updates)
                .retrieve()
                .toBodilessEntity()
                .doOnSuccess(r -> System.out.println("[updateUserProfile] Profil ažuriran za: " + email))
                .doOnError(e -> System.err.println("[updateUserProfile] Greška pri ažuriranju: " + e.getMessage()))
                .then();
    }

    // Ažuriranje UUID-a korisnika
    private Mono<Void> updateKorisnikUuid(String email, String uuid) {
        
        Map<String, Object> updates = new HashMap<>();
        updates.put("uuid", uuid);

        return webClient.patch()
                .uri("/rest/v1/korisnik?email=eq." + email)
                .bodyValue(updates)
                .retrieve()
                .toBodilessEntity()
                .doOnSuccess(r -> System.out.println("[updateKorisnikUuid] UUID ažuriran za: " + email))
                .doOnError(e -> System.err.println("[updateKorisnikUuid] Greška pri ažuriranju UUID-a: " + e.getMessage()))
                .then();
    }

    // Blokiranje
    public Mono<Korisnik> blockUser(Integer idKorisnika) {

        return getKorisnikById(idKorisnika)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        System.err.println("[KorisnikService] Korisnik nije pronađen: " + idKorisnika);
                        return Mono.error(new RuntimeException("Korisnik nije pronađen"));
                    }

                    Map<String, Object> updates = new HashMap<>();
                    updates.put("blokiran", true);

                    return webClient.patch()
                            .uri("/rest/v1/korisnik?id_korisnika=eq." + idKorisnika)
                            .header("Prefer", "return=representation")
                            .bodyValue(updates)
                            .retrieve()
                            .bodyToMono(Korisnik[].class)
                            .doOnNext(niz -> {
                                if (niz.length > 0) {
                                    System.out.println("[KorisnikService] Korisnik je blokiran");
                                }
                            })
                            .map(niz -> niz.length > 0 ? niz[0] : null);
                });
    }

    // Dohvati sve korisnike sa zahtjevom za oglašivanje
    public Mono<Korisnik[]> getPendingAdvertiserRequests() {
        return webClient.get()
                .uri("/rest/v1/korisnik?oglasivac=eq.ZAHTJEV&select=*")
                .retrieve()
                .bodyToMono(Korisnik[].class)
                .doOnNext(niz -> System.out.println("[KorisnikService] Pronađeno " + niz.length + " zahtjeva"));
    }

    // Zahtjev za oglašivanje
    public Mono<Korisnik> requestAdvertiser(String email) {

        return getKorisnikByEmail(email)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        System.err.println("[KorisnikService] Korisnik nije pronađen: " + email);
                        return Mono.error(new RuntimeException("Korisnik nije pronađen"));
                    }

                    if (!"NE".equals(korisnik.getOglasivac())) {
                        System.err.println("[KorisnikService] Korisnik je već ili zahtjev je već poslан: " + korisnik.getOglasivac());
                        return Mono.error(new RuntimeException("Korisnik je već oglašivač ili je zahtjev na čekanju"));
                    }

                    Map<String, Object> updates = new HashMap<>();
                    updates.put("oglasivac", "ZAHTJEV");


                    return webClient.patch()
                            .uri("/rest/v1/korisnik?email=eq." + email)
                            .header("Prefer", "return=representation")
                            .bodyValue(updates)
                            .retrieve()
                            .bodyToMono(Korisnik[].class)
                            .doOnNext(niz -> {
                                if (niz.length > 0) {
                                    System.out.println("[KorisnikService] Zahtjev za oglašivanje je prihvaćen");
                                }
                            })
                            .map(niz -> niz.length > 0 ? niz[0] : null);
                });
    }

    // Prihvati zahtjev za oglašivanje
    public Mono<Korisnik> approveAdvertiserRequest(Integer idKorisnika) {

        return getKorisnikById(idKorisnika)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        System.err.println("[KorisnikService] Korisnik nije pronađen: " + idKorisnika);
                        return Mono.error(new RuntimeException("Korisnik nije pronađen"));
                    }

                    if (!"ZAHTJEV".equals(korisnik.getOglasivac())) {
                        System.err.println("[KorisnikService] Korisnik nema zahtjev na čekanju");
                        return Mono.error(new RuntimeException("Korisnik nema zahtjev na čekanju"));
                    }

                    Map<String, Object> updates = new HashMap<>();
                    updates.put("oglasivac", "DA");


                    return webClient.patch()
                            .uri("/rest/v1/korisnik?id_korisnika=eq." + idKorisnika)
                            .header("Prefer", "return=representation")
                            .bodyValue(updates)
                            .retrieve()
                            .bodyToMono(Korisnik[].class)
                            .doOnNext(niz -> {
                                if (niz.length > 0) {
                                    System.out.println("[KorisnikService] Zahtjev je odobren");
                                }
                            })
                            .map(niz -> niz.length > 0 ? niz[0] : null);
                });
    }

    // Odbij zahtjev za oglašivanje
    public Mono<Korisnik> rejectAdvertiserRequest(Integer idKorisnika) {

        return getKorisnikById(idKorisnika)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        System.err.println("[KorisnikService] Korisnik nije pronađen: " + idKorisnika);
                        return Mono.error(new RuntimeException("Korisnik nije pronađen"));
                    }

                    if (!"ZAHTJEV".equals(korisnik.getOglasivac())) {
                        System.err.println("[KorisnikService] Korisnik nema zahtjev na čekanju");
                        return Mono.error(new RuntimeException("Korisnik nema zahtjev na čekanju"));
                    }

                    Map<String, Object> updates = new HashMap<>();
                    updates.put("oglasivac", "NE");


                    return webClient.patch()
                            .uri("/rest/v1/korisnik?id_korisnika=eq." + idKorisnika)
                            .header("Prefer", "return=representation")
                            .bodyValue(updates)
                            .retrieve()
                            .bodyToMono(Korisnik[].class)
                            .doOnNext(niz -> {
                                if (niz.length > 0) {
                                    System.out.println("[KorisnikService] Zahtjev je odbijen");
                                }
                            })
                            .map(niz -> niz.length > 0 ? niz[0] : null);
                });
    }

    // Odblokiraj korisnika
    public Mono<Korisnik> unblockUser(Integer idKorisnika) {

        return getKorisnikById(idKorisnika)
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        System.err.println("[KorisnikService] Korisnik nije pronađen: " + idKorisnika);
                        return Mono.error(new RuntimeException("Korisnik nije pronađen"));
                    }

                    Map<String, Object> updates = new HashMap<>();
                    updates.put("blokiran", false);


                    return webClient.patch()
                            .uri("/rest/v1/korisnik?id_korisnika=eq." + idKorisnika)
                            .header("Prefer", "return=representation")
                            .bodyValue(updates)
                            .retrieve()
                            .bodyToMono(Korisnik[].class)
                            .doOnNext(niz -> {
                                if (niz.length > 0) {
                                    System.out.println("[KorisnikService] Korisnik je odblokirан");
                                }
                            })
                            .map(niz -> niz.length > 0 ? niz[0] : null);
                });
    }

    // Dohvati sve blokirane korisnike
    public Mono<Korisnik[]> getBlockedUsers() {
        return webClient.get()
                .uri("/rest/v1/korisnik?blokiran=eq.true&select=*")
                .retrieve()
                .bodyToMono(Korisnik[].class)
                .doOnNext(niz -> System.out.println("[KorisnikService] Pronađeno " + niz.length + " blokiranih korisnika"));
    }

    public Mono<List<Rezervacija>> getRezervacijeByIdKorisnika(Integer idKorisnika) {
        return webClient.get()
                .uri("/rest/v1/Rezervacija?id_korisnika=eq." + idKorisnika + "&select=*")
                .retrieve()
                .bodyToMono(Rezervacija[].class)
                .map(niz -> {
                    if (niz == null) return Collections.emptyList();
                    return Arrays.asList(niz);
                });
    }
}