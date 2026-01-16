package com.sparkaj.service;

import com.sparkaj.model.Korisnik;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class KorisnikService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public KorisnikService(WebClient webClient) {
        this.webClient = webClient;
        this.objectMapper = new ObjectMapper();
    }

    // Salje upit Supabase-u, natrag dobiva podatke o korisniku
    public Mono<Korisnik> getKorisnikByNadimak(String nadimak) {
        return webClient.get()
                .uri("/rest/v1/korisnik?nadimak=eq." + nadimak + "&select=*")
                .retrieve()
                .bodyToMono(Korisnik[].class)
                .map(korisnici -> korisnici.length > 0 ? korisnici[0] : null);
    }

    public Mono<Korisnik> getKorisnikByUuid(String uuid) {
        return webClient.get()
                .uri("/rest/v1/korisnik?uuid=eq." + uuid + "&select=*")
                .retrieve()
                .bodyToMono(Korisnik[].class)
                .map(korisnici -> korisnici.length > 0 ? korisnici[0] : null);
    }

    // OAuth2 metode
    public Mono<Void> saveOrUpdateOAuth2Korisnik(String email, String ime, String prezime, String profilna) {
        System.out.println("[KorisnikService] Provjeravamo korisnika: " + email);
        
        return getKorisnikByEmail(email)
                .flatMap(existingKorisnik -> {
                    // Ako korisnik postoji, samo ažuriraj podatke
                    if (existingKorisnik != null) {
                        System.out.println("[KorisnikService] ✓ Korisnik postoji, ažuriramo: " + email);
                        return updateKorisnik(email, ime, prezime, profilna);
                    }
                    // Ako korisnik ne postoji, kreiraj novog
                    System.out.println("[KorisnikService] ✗ Korisnik ne postoji, kreiramo novog: " + email);
                    return createOAuth2Korisnik(email, ime, prezime, profilna);
                })
                .onErrorResume(throwable -> {
                    System.err.println("[saveOrUpdateOAuth2Korisnik] Greška: " + throwable.getMessage());
                    return Mono.empty();
                });
    }

    public Mono<Korisnik> getKorisnikByEmail(String email) {
        return webClient.get()
                .uri("/rest/v1/korisnik?email=eq." + email + "&select=*")
                .retrieve()
                .bodyToMono(Korisnik[].class)
                .map(korisnici -> {
                    if (korisnici.length > 0) {
                        System.out.println("[getKorisnikByEmail] Pronađen korisnik: " + email);
                        return korisnici[0];
                    }
                    System.out.println("[getKorisnikByEmail] Korisnik nije pronađen: " + email);
                    return null;
                })
                .onErrorResume(e -> {
                    System.err.println("[getKorisnikByEmail] Greška: " + e.getMessage());
                    return Mono.empty();
                });
    }

    private Mono<Void> updateKorisnik(String email, String ime, String prezime, String profilna) {
        Map<String, Object> updates = new HashMap<>();
        if (ime != null) updates.put("ime", ime);
        if (prezime != null) updates.put("prezime", prezime);
        if (profilna != null) updates.put("profilna", profilna);

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

    private Mono<Void> createOAuth2Korisnik(String email, String ime, String prezime, String profilna) {
        Map<String, Object> newKorisnik = new HashMap<>();
        newKorisnik.put("email", email);
        newKorisnik.put("ime", ime != null ? ime : "");
        newKorisnik.put("prezime", prezime != null ? prezime : "");
        newKorisnik.put("profilna", profilna != null ? profilna : "");
        newKorisnik.put("uuid", UUID.randomUUID().toString());
        newKorisnik.put("nadimak", email.split("@")[0]); // Automatski nadimak

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
}