package com.sparkaj.service;


import com.sparkaj.model.GradBody;
import com.sparkaj.model.CreateOglasRequest;
import com.sparkaj.model.FilterOglasBody;
import com.sparkaj.model.Oglas;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;

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
                .uri("/rest/v1/oglas?select=*,korisnik(*)")
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(Arrays::asList);
    }
       
    public Mono<List<GradBody>> getLokacije() {
        System.out.println(" Dohvaćam oglase iz baze...");        
        
        return webClient.get()
                .uri("/rest/v1/oglas?select=grad")
                .retrieve()
                .bodyToMono(GradBody[].class)
                .map(Arrays::asList).map(list -> list.stream().distinct().collect(Collectors.toList()));
                
    }
    
    public Mono<List<Oglas>> pretraziOglase(FilterOglasBody fob) {
        System.out.println(" Dohvaćam oglase iz baze...");
        String query = "?";
        if(fob.getLocation() != null) {
        	query += "adresa_full=ilike.*" + fob.getLocation() + "*&";
        }
        if(fob.getPriceMin() > 0.0f) {
        	query += "cijena=gte." + fob.getPriceMin() + "&";
        }
        if(fob.getPriceMax() > 0.0f) {
        	query += "cijena=lte." + fob.getPriceMax() + "&";
        }
        query = query.substring(0, query.length() - 1);
        System.out.println("Query: " + query);
        return webClient.get()
                .uri("/rest/v1/oglasi_fulladresa" + query)
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(Arrays::asList);
    }
        
    public Mono<List<Oglas>> kreirajOglas(Oglas oglas) {
        System.out.println(" Kreiram oglas");

        return webClient.post()
                .uri("/rest/v1/oglas")
                .bodyValue(oglas)
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(Arrays::asList);
    }

    public Mono<Oglas> createOglas(CreateOglasRequest request) {
        System.out.println("[createOglas] Počinjem kreiranje oglasa");
        System.out.println("[createOglas] Request UUID: " + request.getUuid());
        System.out.println("[createOglas] Request IdKorisnika: " + request.getIdKorisnika());
        System.out.println("[createOglas] Naziv: " + request.getNazivOglasa());
        
        // Ako je id_korisnika dostupan (Spring Boot OAuth2), koristi ga direktno
        if (request.getIdKorisnika() != null) {
            Map<String, Object> oglasMap = new HashMap<>();
            oglasMap.put("naziv_oglasa", request.getNazivOglasa());
            oglasMap.put("opis_oglasa", request.getOpisOglasa());
            oglasMap.put("cijena", request.getCijena());
            oglasMap.put("grad", request.getGrad());
            oglasMap.put("ulica_broj", request.getUlicaBroj());
            oglasMap.put("postanski_broj", request.getPostanskiBroj());
            oglasMap.put("id_korisnika", request.getIdKorisnika());
            oglasMap.put("slika", request.getSlika());
            System.out.println("[createOglas] Kreiram oglas sa id_korisnika: " + request.getIdKorisnika());
            System.out.println("[createOglas] OglasMap: " + oglasMap);
            return webClient.post()
                    .uri("/rest/v1/oglas")
                    .bodyValue(oglasMap)
                    .exchangeToMono(response -> {
                        System.out.println("[createOglas] Response status (id_korisnika path): " + response.statusCode());
                        if (response.statusCode().is2xxSuccessful()) {
                            System.out.println("[createOglas] ✓ Oglas uspješno kreiran sa id_korisnika");
                            return response.bodyToMono(Oglas.class);
                        } else {
                            return response.bodyToMono(String.class)
                                .flatMap(body -> {
                                    System.err.println("[createOglas] ✗ Greška: " + response.statusCode() + " " + body);
                                    return Mono.error(new RuntimeException("Supabase error: " + response.statusCode() + " " + body));
                                });
                        }
                    });
        }
        
        // Inače, traži korisnika po uuid (stari nacin)
        System.out.println("[createOglas] ID korisnika je NULL, tražim po UUID-u: " + request.getUuid());
        return korisnikService.getKorisnikByUuid(request.getUuid())
                .flatMap(korisnik -> {
                    System.out.println("[createOglas] Pronađen korisnik: " + (korisnik != null ? korisnik.getIdKorisnika() : "NULL"));
                    if (korisnik == null) {
                        System.err.println("[createOglas] ✗ Korisnik nije pronađen sa UUID: " + request.getUuid());
                        return Mono.error(new RuntimeException("Korisnik not found for UUID: " + request.getUuid()));
                    }
                    Map<String, Object> oglasMap = new HashMap<>();
                    oglasMap.put("naziv_oglasa", request.getNazivOglasa());
                    oglasMap.put("opis_oglasa", request.getOpisOglasa());
                    oglasMap.put("cijena", request.getCijena());
                    oglasMap.put("grad", request.getGrad());
                    oglasMap.put("ulica_broj", request.getUlicaBroj());
                    oglasMap.put("postanski_broj", request.getPostanskiBroj());
                    oglasMap.put("id_korisnika", korisnik.getIdKorisnika());
                    oglasMap.put("slika", request.getSlika());
                    System.out.println("[createOglas] Kreiram oglas sa id_korisnika iz UUID: " + korisnik.getIdKorisnika());
                    System.out.println("[createOglas] OglasMap: " + oglasMap);
                    return webClient.post()
                            .uri("/rest/v1/oglas")
                            .bodyValue(oglasMap)
                            .exchangeToMono(response -> {
                                System.out.println("[createOglas] Response status (UUID path): " + response.statusCode());
                                if (response.statusCode().is2xxSuccessful()) {
                                    System.out.println("[createOglas] ✓ Oglas uspješno kreiran sa UUID");
                                    return response.bodyToMono(Oglas.class);
                                } else {
                                    return response.bodyToMono(String.class)
                                        .flatMap(body -> {
                                            System.err.println("[createOglas] ✗ Greška: " + response.statusCode() + " " + body);
                                            return Mono.error(new RuntimeException("Supabase error: " + response.statusCode() + " " + body));
                                        });
                                }
                            });
                });
    }

    public Mono<List<Oglas>> getOglasiByIdKorisnika(Integer idKorisnika) {
        return webClient.get()
                .uri("/rest/v1/oglas?id_korisnika=eq." + idKorisnika + "&select=*")
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(Arrays::asList);
    }
    
    public Mono<List<Oglas>> azurirajOglas(Long id, Oglas oglas) {
        System.out.println(" Azuriram oglas " + id.toString());
        oglas.setIdOglasa(id.intValue());
        return webClient.put()
                .uri("/rest/v1/oglas?id_oglasa=eq." + id.toString())
                .bodyValue(oglas)
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(Arrays::asList);
    }
    
    public Mono<List<Oglas>> obrisiOglas(Long id) {
        System.out.println(" Brisem oglas " + id.toString());
        return webClient.delete()
                .uri("/rest/v1/oglas?id_oglasa=eq." + id.toString())
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(Arrays::asList);
    }

    // Dohvati podatke o oglasu
    public Mono<Oglas> getOglasById(Integer id) {
        return webClient.get()
                .uri("/rest/v1/oglas?id_oglasa=eq." + id + "&select=*,korisnik(*)")
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(niz -> niz.length > 0 ? niz[0] : null);
    }

    // Dohvat svih oglasa jednog korisnika
    public Mono<List<Oglas>> getOglasiByKorisnikId(Integer idKorisnika) {
        return webClient.get()
                .uri("/rest/v1/oglas?id_korisnika=eq." + idKorisnika + "&select=*")
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(oglasi -> {
                    List<Oglas> lista = Arrays.asList(oglasi);
                    return lista;
                });
    }

    // Pronađi ID rezervacije za korisnika na ovaj oglas
    public Mono<Long> findReservation(Integer idKorisnika, Integer idOglasa) {
        return webClient.get()
                .uri("/rest/v1/Rezervacija?id_korisnika=eq." + idKorisnika + "&id_oglasa=eq." + idOglasa + "&select=id_rezervacije&limit=1")
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(response -> {
                    try {
                        // Parse JSON array to find id_rezervacije
                        if (response.contains("id_rezervacije")) {
                            // Simple extraction - assumes response like [{"id_rezervacije":123}]
                            int startIdx = response.indexOf("id_rezervacije") + 15;
                            int endIdx = response.indexOf("}", startIdx);
                            String idStr = response.substring(startIdx, endIdx).trim().replaceAll("[^0-9]", "");
                            if (!idStr.isEmpty()) {
                                return Mono.just(Long.parseLong(idStr));
                            }
                        }
                        return Mono.just((Long) null);
                    } catch (Exception e) {
                        System.err.println("Error parsing reservation: " + e.getMessage());
                        return Mono.just((Long) null);
                    }
                })
                .onErrorResume(error -> {
                    System.err.println("Error finding reservation: " + error.getMessage());
                    return Mono.just((Long) null);
                });
    }

    // Spremi ili ažurira recenziju sa id_rezervacije
    public Mono<Object> submitReview(Long idRezervacije, Long ocjena) {
        // Prvo provjeri postoji li recenzija za ovu rezervaciju
        return webClient.get()
                .uri("/rest/v1/Recenzija?id_rezervacije=eq." + idRezervacije + "&select=id_recenzije")
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(response -> {
                    // Ako recenzija postoji, ažuriraj je
                    if (response.contains("id_recenzije")) {
                        System.out.println("Existing review found, updating...");
                        String updateBody = "{\"ocjena\":" + ocjena + "}";
                        return webClient.patch()
                                .uri("/rest/v1/Recenzija?id_rezervacije=eq." + idRezervacije)
                                .header("Content-Type", "application/json")
                                .header("Prefer", "return=representation")
                                .bodyValue(updateBody)
                                .retrieve()
                                .bodyToMono(Object.class);
                    } else {
                        // Ako ne postoji, kreiraj novu
                        System.out.println("No existing review, creating new one...");
                        String insertBody = "{" +
                                "\"id_rezervacije\":" + idRezervacije + "," +
                                "\"ocjena\":" + ocjena +
                                "}";
                        return webClient.post()
                                .uri("/rest/v1/Recenzija")
                                .header("Content-Type", "application/json")
                                .header("Prefer", "return=representation")
                                .bodyValue(insertBody)
                                .retrieve()
                                .bodyToMono(Object.class);
                    }
                })
                .onErrorResume(error -> {
                    System.err.println("Review submission error: " + error.getMessage());
                    return Mono.error(new RuntimeException("Greška pri spremanju recenzije: " + error.getMessage()));
                });
    }
}