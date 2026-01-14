package com.sparkaj.service;

import com.sparkaj.model.Transakcija;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.time.LocalDateTime;

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

        System.out.println("=== Saving Transakcija ===");
        System.out.println("Payment Intent ID: " + transakcija.getIdTransakcija());
        System.out.println("Reservation ID: " + transakcija.getIdRezervacije());
        System.out.println("Amount: " + transakcija.getIznos());
        System.out.println("Paid: " + transakcija.getPlaceno());

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
}
