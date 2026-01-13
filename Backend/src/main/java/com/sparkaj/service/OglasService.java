package com.sparkaj.service;


import com.sparkaj.model.GradBody;
import com.sparkaj.model.CreateOglasRequest;
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
                .map(Arrays::asList)
                .doOnNext(oglasi -> {
                    System.out.println("Fetched oglasi: " + oglasi.size());
                    oglasi.forEach(o -> System.out.println("Oglas: " + o.getNazivOglasa() + ", Korisnik: " + (o.getKorisnik() != null ? o.getKorisnik().getEmail() : "null")));
                });
    }
    
    public Mono<List<Oglas>> getOglasId(Long id) {
        System.out.println(" Dohvaćam oglas " + id.toString() + " iz baze...");

        return webClient.get()
                .uri("/rest/v1/oglas?id_oglasa=eq." + id.toString())
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
    
    public Mono<List<Oglas>> pretraziOglaseLok(String lokacija) {
        System.out.println(" Dohvaćam oglase iz baze...");

        return webClient.get()
                .uri("/rest/v1/oglas?ulica_broj=ilike.*" + lokacija + "*")
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(Arrays::asList);
    }
    
    public Mono<List<Oglas>> pretraziOglaseCij(String cijenaOd, String cijenaDo) {
        System.out.println(" Dohvaćam oglase iz baze...");

        return webClient.get()
                .uri("/rest/v1/oglas?cijena=gte." + cijenaOd + "&cijena=lte." + cijenaDo)
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

    // Kreiranje novog oglasa
    public Mono<Oglas> createOglas(CreateOglasRequest request) {
        // First, get korisnik by uuid
        return korisnikService.getKorisnikByUuid(request.getUuid())
                .flatMap(korisnik -> {
                    if (korisnik == null) {
                        return Mono.error(new RuntimeException("Korisnik not found"));
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
                    return webClient.post()
                            .uri("/rest/v1/oglas")
                            .bodyValue(oglasMap)
                            .exchangeToMono(response -> {
                                if (response.statusCode().is2xxSuccessful()) {
                                    return response.bodyToMono(Oglas.class);
                                } else {
                                    return response.bodyToMono(String.class)
                                        .flatMap(body -> Mono.error(new RuntimeException("Supabase error: " + response.statusCode() + " " + body)));
                                }
                            });
                });
    }
}