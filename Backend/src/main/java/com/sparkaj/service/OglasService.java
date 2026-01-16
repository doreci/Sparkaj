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

    public Mono<Oglas> kreirajOglas(CreateOglasRequest request) {
        Oglas oglas = new Oglas();
        oglas.setNazivOglasa(request.getNazivOglasa());
        oglas.setOpisOglasa(request.getOpisOglasa());
        oglas.setCijena(request.getCijena());
        oglas.setSlika(request.getSlika());
        oglas.setIdKorisnika(request.getIdKorisnika()); // Direktno postavljanje

        return webClient.post()
                .uri("/rest/v1/oglas")
                .header("Prefer", "return=representation")
                .bodyValue(oglas)
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(niz -> niz[0]);
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

    public Mono<List<Oglas>> getOglasiByIdKorisnika(int idKorisnika) {
        return webClient.get()
                .uri("/rest/v1/oglas?id_korisnika=eq." + idKorisnika + "&select=*")
                .retrieve()
                .bodyToMono(Oglas[].class)
                .map(Arrays::asList);
    }

}