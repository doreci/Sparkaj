package com.sparkaj.service;

import com.sparkaj.model.Oglas;
import com.sparkaj.model.Rezervacija;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Service
public class RezervacijaService {

    private final WebClient webClient;

    public RezervacijaService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<Rezervacija> createRezervacija(Long korisnikId, Long oglasId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime later = now.plusHours(1);
        
        return createRezervacijaWithDetails(korisnikId, oglasId, now, later);
    }

    public Mono<Rezervacija> createRezervacijaWithDetails(Long korisnikId, Long oglasId, LocalDateTime datumOd, LocalDateTime datumDo) {
        // Format dates as ISO strings
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        
        // First, get the max ID from existing reservations to generate next ID
        return webClient.get()
                .uri("/rest/v1/Rezervacija?select=id_rezervacije&order=id_rezervacije.desc&limit=1")
                .retrieve()
                .bodyToMono(Rezervacija[].class)
                .flatMap(existing -> {
                    Long nextId = 1L;
                    if (existing != null && existing.length > 0 && existing[0].getIdRezervacije() != null) {
                        nextId = existing[0].getIdRezervacije() + 1;
                    }
                    
                    // Create JSON string with the generated ID
                    String jsonBody = "{\"id_rezervacije\":" + nextId +
                                     ",\"id_korisnika\":" + korisnikId + 
                                     ",\"id_oglasa\":" + oglasId + 
                                     ",\"datumOd\":\"" + datumOd.format(formatter) + "\"" +
                                     ",\"datumDo\":\"" + datumDo.format(formatter) + "\"}";
                    
                    System.out.println("Creating reservation with ID: " + nextId + " for user: " + korisnikId + ", ad: " + oglasId);
                    System.out.println("Reservation JSON: " + jsonBody);
                    
                    return insertReservacija(jsonBody);
                });
    }

    private Mono<Rezervacija> insertReservacija(String jsonBody) {
        return webClient.post()
                .uri("/rest/v1/Rezervacija")
                .header("Prefer", "return=representation")
                .header("Content-Type", "application/json")
                .bodyValue(jsonBody)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(),
                    response -> response.bodyToMono(String.class)
                        .flatMap(error -> {
                            System.err.println("Supabase error creating reservation: " + error);
                            System.err.println("Sent JSON: " + jsonBody);
                            return Mono.error(new RuntimeException("Failed to create reservation: " + error));
                        })
                )
                .bodyToMono(Rezervacija[].class)
                .doOnNext(result -> {
                    if (result != null && result.length > 0) {
                        System.out.println("Reservation created successfully with ID: " + result[0].getIdRezervacije());
                    }
                })
                .doOnError(error -> System.err.println("Reservation creation failed: " + error.getMessage()))
                .map(niz -> niz != null && niz.length > 0 ? niz[0] : null);
    }
}
