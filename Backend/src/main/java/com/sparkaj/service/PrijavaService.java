package com.sparkaj.service;

import com.sparkaj.model.Prijava;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Arrays;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Service
public class PrijavaService {

    private final WebClient webClient;

    public PrijavaService(WebClient webClient) {
        this.webClient = webClient;
    }

    // Kreiraj novu prijavu
    public Mono<Prijava> kreirajPrijavu(Integer idKorisnika, Integer idOglasa, String opis) {
        
        Map<String, Object> prijavaMapa = new HashMap<>();
        prijavaMapa.put("id_korisnika", idKorisnika);
        prijavaMapa.put("id_oglasa", idOglasa);
        prijavaMapa.put("opis", opis);
        prijavaMapa.put("status", false);

        return webClient.post()
                .uri("/rest/v1/prijava")
                .bodyValue(prijavaMapa)
                .exchangeToMono(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        return response.bodyToMono(Prijava.class);
                    } else {
                        return response.bodyToMono(String.class)
                            .flatMap(body -> {
                                System.err.println("[PrijavaService] ✗ Greška: " + response.statusCode() + " " + body);
                                return Mono.error(new RuntimeException("Supabase error: " + response.statusCode() + " " + body));
                            });
                    }
                });
    }

    // Dohvati sve prijave
    public Mono<List<Prijava>> getPrijave() {
        
        return webClient.get()
                .uri("/rest/v1/prijava?select=*")
                .retrieve()
                .bodyToMono(Prijava[].class)
                .map(Arrays::asList)
                .onErrorResume(e -> {
                    System.err.println("[PrijavaService] Greška pri dohvaćanju prijava: " + e.getMessage());
                    return Mono.just(Arrays.asList());
                });
    }

    // Dohvati sve prijave za određeni oglas
    public Mono<List<Prijava>> getPrijaveByIdOglasa(Integer idOglasa) {
        
        return webClient.get()
                .uri("/rest/v1/prijava?id_oglasa=eq." + idOglasa)
                .retrieve()
                .bodyToMono(Prijava[].class)
                .map(Arrays::asList)
                .onErrorResume(e -> {
                    System.err.println("[PrijavaService] Greška pri dohvaćanju prijava: " + e.getMessage());
                    return Mono.just(Arrays.asList());
                });
    }

    // Dohvati sve prijave korisnika
    public Mono<List<Prijava>> getPrijaveByIdKorisnika(Integer idKorisnika) {
        
        return webClient.get()
                .uri("/rest/v1/prijava?id_korisnika=eq." + idKorisnika)
                .retrieve()
                .bodyToMono(Prijava[].class)
                .map(Arrays::asList)
                .onErrorResume(e -> {
                    System.err.println("[PrijavaService] Greška pri dohvaćanju prijava: " + e.getMessage());
                    return Mono.just(Arrays.asList());
                });
    }

    // Ažuriraj status prijave
    public Mono<Prijava> azurirajStatus(Integer idPrijave, Boolean noviStatus) {
        
        Map<String, Object> updateMapa = new HashMap<>();
        updateMapa.put("status", noviStatus);

        return webClient.patch()
                .uri("/rest/v1/prijava?id_prijave=eq." + idPrijave)
                .bodyValue(updateMapa)
                .exchangeToMono(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        Prijava updatedPrijava = new Prijava();
                        updatedPrijava.setId_prijave(idPrijave);
                        updatedPrijava.setStatus(noviStatus);
                        return Mono.just(updatedPrijava);
                    } else {
                        return response.bodyToMono(String.class)
                            .flatMap(body -> {
                                System.err.println("[PrijavaService] ✗ Greška: " + response.statusCode() + " " + body);
                                return Mono.error(new RuntimeException("Supabase error: " + response.statusCode() + " " + body));
                            });
                    }
                })
                .onErrorResume(e -> {
                    System.err.println("[PrijavaService] ✗ Greška pri ažuriranju: " + e.getMessage());
                    e.printStackTrace();
                    return Mono.error(e);
                });
    }

    // Obriši prijavu
    public Mono<Void> obrisiPrijavu(Integer idPrijave) {
        
        return webClient.delete()
                .uri("/rest/v1/prijava?id_prijave=eq." + idPrijave)
                .retrieve()
                .bodyToMono(Void.class)
                .onErrorResume(e -> {
                    System.err.println("[PrijavaService] Greška pri brisanju prijave: " + e.getMessage());
                    return Mono.error(e);
                });
    }
}
