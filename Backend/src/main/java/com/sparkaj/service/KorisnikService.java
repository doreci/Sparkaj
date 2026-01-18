package com.sparkaj.service;

import com.sparkaj.model.Korisnik;
import com.sparkaj.model.UpdateProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class KorisnikService {

    private final WebClient webClient;

    public KorisnikService(WebClient webClient) {
        this.webClient = webClient;
    }

    // Salje upit Supabase-u, natrag dobiva podatke o korisniku
    public Mono<Korisnik> getKorisnikByUuid(String uuid) {
        System.out.println("[getKorisnikByUuid] Tražim korisnika sa UUID: " + uuid);
        return webClient.get()
                .uri("/rest/v1/korisnik?uuid=eq." + uuid + "&select=*")
                .retrieve()
                .bodyToMono(Korisnik[].class)
                .doOnNext(korisnici -> {
                    if (korisnici != null && korisnici.length > 0) {
                        System.out.println("[getKorisnikByUuid] ✓ Pronađen korisnik: ID=" + korisnici[0].getIdKorisnika() + ", Email=" + korisnici[0].getEmail());
                    } else {
                        System.out.println("[getKorisnikByUuid] ✗ Korisnik nije pronađen za UUID: " + uuid);
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
        System.out.println("[KorisnikService.saveOrUpdateOAuth2Korisnik] POČETO - email: " + email + ", UUID: " + uuid);
        
        return getKorisnikByEmail(email)
                .doOnNext(korisnik -> System.out.println("[KorisnikService.saveOrUpdateOAuth2Korisnik] Korisnik postoji, ne kreiramo novog"))
                .then() // Konvertiraj Korisnik u Void
                .switchIfEmpty(Mono.defer(() -> {
                    System.out.println("[KorisnikService.saveOrUpdateOAuth2Korisnik] Korisnik ne postoji, kreiramo novog");
                    return createOAuth2Korisnik(email, ime, prezime, profilna, uuid);
                }))
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
                        System.out.println("[getKorisnikByEmail] Pronađen korisnik: " + email);
                        return Mono.just(korisnici[0]);
                    }
                    System.out.println("[getKorisnikByEmail] Korisnik nije pronađen: " + email);
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

        System.out.println("[updateKorisnik] Ažuriramo korisnika: " + email + " sa podacima: " + updates);
        
        return webClient.patch()
                .uri("/rest/v1/korisnik?email=eq." + email)
                .bodyValue(updates)
                .retrieve()
                .toBodilessEntity()
                .doOnSuccess(r -> System.out.println("[updateKorisnik] ✓ Korisnik ažuriran: " + email))
                .doOnError(e -> System.err.println("[updateKorisnik] ✗ Greška pri ažuriranju: " + e.getMessage()))
                .then();
    }

    private Mono<Void> createOAuth2Korisnik(String email, String ime, String prezime, String profilna, String uuid) {
        Map<String, Object> newKorisnik = new HashMap<>();
        newKorisnik.put("email", email);
        newKorisnik.put("ime", ime != null ? ime : "");
        newKorisnik.put("prezime", prezime != null ? prezime : "");
        newKorisnik.put("profilna", profilna != null ? profilna : "");
        newKorisnik.put("uuid", uuid != null ? uuid : UUID.randomUUID().toString());

        System.out.println("[createOAuth2Korisnik] Kreiramo novog korisnika sa podacima: " + newKorisnik);
        
        
        return webClient.post()
                .uri("/rest/v1/korisnik")
                .bodyValue(newKorisnik)
                .retrieve()
                .toBodilessEntity()
                .doOnSuccess(r -> System.out.println("[createOAuth2Korisnik] ✓ Novi korisnik kreiran: " + email))
                .doOnError(e -> System.err.println("[createOAuth2Korisnik] ✗ Greška pri kreiranju: " + e.getMessage()))
                .then();
    }

    // Ažuriranje profila korisnika
    public Mono<Void> updateUserProfile(String email, UpdateProfileRequest updateRequest) {
        System.out.println("[updateUserProfile] Ažuriramo profil za email: " + email);
        
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

        System.out.println("[updateUserProfile] Podatci za ažuriranje: " + updates);

        return webClient.patch()
                .uri("/rest/v1/korisnik?email=eq." + email)
                .bodyValue(updates)
                .retrieve()
                .toBodilessEntity()
                .doOnSuccess(r -> System.out.println("[updateUserProfile] ✓ Profil ažuriran za: " + email))
                .doOnError(e -> System.err.println("[updateUserProfile] ✗ Greška pri ažuriranju: " + e.getMessage()))
                .then();
    }
}