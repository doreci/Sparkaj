package com.sparkaj.service;

import com.sparkaj.model.Korisnik;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class KorisnikService {

    private final WebClient webClient;

    public KorisnikService(WebClient webClient) {
        this.webClient = webClient;
    }

    // Salje upit Supabase-u, natrag dobiva podatke o korisniku
    public Mono<Korisnik> getKorisnikById(int idKorisnika) {
        return webClient.get()
                .uri("/rest/v1/korisnik?id_korisnika=eq." + idKorisnika + "&select=*")
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
}