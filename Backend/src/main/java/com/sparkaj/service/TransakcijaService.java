package com.sparkaj.service;

import com.sparkaj.model.Transakcija;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class TransakcijaService {

    private final WebClient webClient;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.api.key}")
    private String supabaseApiKey;

    public TransakcijaService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<Transakcija> saveTransakcija(String paymentIntentId, Long idRezervacije, Double iznos) {
        Transakcija transakcija = new Transakcija(
                paymentIntentId,
                idRezervacije,
                iznos != null ? iznos.floatValue() : 0f,
                LocalDateTime.now(),
                true
        );

        // System.out.println("=== Saving Transakcija ===");
        // System.out.println("Payment Intent ID: " + transakcija.getIdTransakcija());
        // System.out.println("Reservation ID: " + transakcija.getIdRezervacije());
        // System.out.println("Amount: " + transakcija.getIznos());
        // System.out.println("Paid: " + transakcija.getPlaceno());

        return webClient.post()
                .uri("/rest/v1/Transakcija")
                .header("Prefer", "return=representation")
                .bodyValue(transakcija)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), 
                    response -> response.bodyToMono(String.class)
                        .flatMap(error -> {
                            System.err.println("Supabase error: " + error);
                            return Mono.error(new RuntimeException("Supabase error: " + error));
                        })
                )
                .bodyToMono(Transakcija[].class)
                .doOnNext(result -> System.out.println("Transaction saved successfully"))
                .doOnError(error -> System.err.println("Transaction save failed: " + error.getMessage()))
                .map(niz -> niz.length > 0 ? niz[0] : transakcija);
    }

    public Mono<Transakcija> getTransakcijaByPaymentId(String paymentIntentId) {
        return webClient.get()
                .uri("/rest/v1/Transakcija?id_transakcija=eq." + paymentIntentId)
                .retrieve()
                .bodyToMono(Transakcija[].class)
                .map(niz -> niz.length > 0 ? niz[0] : null);
    }

    public Flux<Transakcija> getTransakcijeByUserId(Long userId) {
        return webClient.get()
                .uri("/rest/v1/Rezervacija?id_korisnika=eq." + userId)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), 
                    response -> response.bodyToMono(String.class)
                        .flatMap(error -> Mono.error(new RuntimeException("Supabase error: " + error)))
                )
                .bodyToMono(com.sparkaj.model.Rezervacija[].class)
                .flatMapMany(rezervacije -> {
                    if (rezervacije == null || rezervacije.length == 0) {
                        return Flux.empty();
                    }
                    StringBuilder orQuery = new StringBuilder();
                    for (int i = 0; i < rezervacije.length; i++) {
                        if (i > 0) orQuery.append(",");
                        orQuery.append("id_rezervacije.eq.").append(rezervacije[i].getIdRezervacije());
                    }
                    return webClient.get()
                            .uri("/rest/v1/Transakcija?or=(" + orQuery.toString() + ")&order=datum_transakcije.desc")
                            .retrieve()
                            .onStatus(status -> !status.is2xxSuccessful(),
                                response -> response.bodyToMono(String.class)
                                    .flatMap(error -> Mono.error(new RuntimeException("Supabase error: " + error)))
                            )
                            .bodyToMono(Transakcija[].class)
                            .flatMapMany(transakcije -> {
                                if (transakcije == null || transakcije.length == 0) {
                                    return Flux.empty();
                                }
                                return Flux.fromIterable(Arrays.asList(transakcije));
                            });
                })
                .doOnNext(t -> System.out.println("Fetched transaction: " + t.getIdTransakcija()))
                .doOnError(error -> System.err.println("Error fetching transactions: " + error.getMessage()));
    }
}
