package com.sparkaj.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sparkaj.model.Oglas;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Arrays;
import java.util.List;

@Service
public class OglasService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public OglasService(WebClient webClient, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.objectMapper = objectMapper;
        System.out.println("OglasService created");
    }

    public Mono<List<Oglas>> getAllOglasi() {
        System.out.println(" Dohvaćam oglase iz baze...");

        return webClient.get()
                .uri("/rest/v1/oglas?select=*")
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

    private Mono<List<Oglas>> parseOglasiResponse(String response) {
        try {
            Oglas[] oglasi = objectMapper.readValue(response, Oglas[].class);
            return Mono.just(Arrays.asList(oglasi));
        } catch (JsonProcessingException e) {
            System.out.println(" Greška pri parsiranju JSON: " + e.getMessage());
            return Mono.error(e);
        }
    }
}