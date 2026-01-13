package com.sparkaj.service;

import com.sparkaj.model.Oglas;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Arrays;
import java.util.List;

@Service
public class OglasService {

    private final WebClient webClient;
    private final KorisnikService korisnikService;

    public OglasService(WebClient webClient, KorisnikService korisnikService) {
        this.webClient = webClient;
        this.korisnikService = korisnikService;
    }

    // Dohvat svih oglasa za glavnu stranicu
    public Mono<List<Oglas>> getAllOglasi() {
        return webClient.get()
                .uri("/rest/v1/oglas?select=*")
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(Arrays::asList);
    }
    
    public Mono<List<Oglas>> getOglasId(Long id) {
        System.out.println(" Dohvaćam oglas " + id.toString() + " iz baze...");

        return webClient.get()
                .uri("/rest/v1/oglas?id_oglasa=eq." + id.toString())
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(this::parseOglasiResponse)
                .doOnNext(oglasi -> {
                    System.out.println(" Pronađeno " + oglasi.size() + " oglasa");
                })
                .doOnError(error -> {
                    System.out.println(" Greška: " + error.getMessage());
                });
    }
    
    public Mono<List<Oglas>> kreirajOglas(Oglas oglas) {
        System.out.println(" Kreiram oglas");

        return webClient.post()
                .uri("/rest/v1/oglas")
                .bodyValue(oglas)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(this::parseOglasiResponse)
                .doOnNext(oglasi -> {
                    System.out.println(" Pronađeno " + oglasi.size() + " oglasa");
                })
                .doOnError(error -> {
                    System.out.println(" Greška: " + error.getMessage());
                });
    }
    
    public Mono<List<Oglas>> azurirajOglas(Long id, Oglas oglas) {
        System.out.println(" Azuriram oglas " + id.toString());
        oglas.setIdOglasa(id.intValue());
        return webClient.put()
                .uri("/rest/v1/oglas?id_oglasa=eq." + id.toString())
                .bodyValue(oglas)
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(this::parseOglasiResponse)
                .doOnNext(oglasi -> {
                    System.out.println(" Pronađeno " + oglasi.size() + " oglasa");
                })
                .doOnError(error -> {
                    System.out.println(" Greška: " + error.getMessage());
                });
    }
    
    public Mono<List<Oglas>> obrisiOglas(Long id) {
        System.out.println(" Brisem oglas " + id.toString());
        return webClient.delete()
                .uri("/rest/v1/oglas?id_oglasa=eq." + id.toString())
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(this::parseOglasiResponse)
                .doOnNext(oglasi -> {
                    System.out.println(" Pronađeno " + oglasi.size() + " oglasa");
                })
                .doOnError(error -> {
                    System.out.println(" Greška: " + error.getMessage());
                });
    }

    // Dohvati podatke o oglasu
    public Mono<Oglas> getOglasById(Integer id) {
        return webClient.get()
                .uri("/rest/v1/oglas?id_oglasa=eq." + id + "&select=*")
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(niz -> niz.length > 0 ? niz[0] : null);
    }

    // Dohvat svih oglasa jednog korisnika
    public Mono<List<Oglas>> getOglasiByKorisnikNadimak(String nadimak) {
        return korisnikService.getKorisnikByNadimak(nadimak)
                .flatMap(korisnik -> {
                    if (korisnik == null) return Mono.empty();

                    return webClient.get()
                            .uri("/rest/v1/oglas?id_korisnika=eq." + korisnik.getIdKorisnika() + "&select=*")
                            .retrieve()
                            .bodyToMono(Oglas[].class)
                            .map(oglasi -> {
                                List<Oglas> lista = Arrays.asList(oglasi);
                                for (Oglas o : lista) {
                                    o.setKorisnik(korisnik);
                                }
                                return lista;
                            });
                });
    }
}