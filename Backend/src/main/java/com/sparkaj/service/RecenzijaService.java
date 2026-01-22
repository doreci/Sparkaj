package com.sparkaj.service;

import com.sparkaj.model.Recenzija;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Arrays;
import java.util.List;

@Service
public class RecenzijaService {

    private final WebClient webClient;

    public RecenzijaService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<List<Recenzija>> getRecenzijeByIdKorisnika(Integer idKorisnika) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/rest/v1/Recenzija")
                        .queryParam("Rezervacija.id_korisnika", "eq." + idKorisnika)
                        .queryParam("select", "*,Rezervacija(*)")
                        .build())
                .retrieve()
                .bodyToMono(Recenzija[].class)
                .map(Arrays::asList)
                .onErrorResume(e -> Mono.just(List.of()));
    }
}