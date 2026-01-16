package com.sparkaj.controller;

import com.sparkaj.model.CreateOglasRequest;
import com.sparkaj.model.FilterOglasBody;
import com.sparkaj.model.Oglas;
import com.sparkaj.service.OglasService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.List;

@RestController
@RequestMapping("/api/oglasi")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:10000", "https://sparkaj-g53p.onrender.com"})
public class OglasController {

    private final OglasService oglasService;

    public OglasController(OglasService oglasService) {
        this.oglasService = oglasService;
        System.out.println(" OglasController created");
    }

    // Dohvat svih oglasa
    @GetMapping
    public Mono<ResponseEntity<List<Oglas>>> getAllOglasi() {
        return oglasService.getAllOglasi()
                .map(ResponseEntity::ok);
    }
    
    @GetMapping("/{id}")
    public Mono<Oglas> getOglasById(@PathVariable Integer id) {
        return oglasService.getOglasById(id);
    }

    @PostMapping("/search")
    public Mono<ResponseEntity<List<Oglas>>> pretraziOglase(@RequestBody FilterOglasBody fob) {
        return oglasService.pretraziOglase(fob)
                .map(ResponseEntity::ok);
    }
    
    @PostMapping
    public Mono<ResponseEntity<Oglas>> kreirajOglas(@RequestBody CreateOglasRequest request) {
        System.out.println("[OglasController] POST /api/oglasi - Primljen zahtjev");
        System.out.println("[OglasController] Request body: " + request);
        return oglasService.createOglas(request)
                .map(ResponseEntity::ok)
                .onErrorResume(error -> {
                    System.err.println("[OglasController] ✗ Greška pri kreiranju oglasa: " + error.getMessage());
                    error.printStackTrace();
                    return Mono.just(ResponseEntity.status(500).build());
                });
    }
    
    @PutMapping("/{id}")
    public Mono<ResponseEntity<List<Oglas>>> azurirajOglas(@PathVariable("id") Long id, @RequestBody Oglas oglas) {
        return oglasService.azurirajOglas(id, oglas)
                .map(ResponseEntity::ok);
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteOglas(@PathVariable Integer id) {
        return oglasService.obrisiOglas(id.longValue())
                .map(oglasi -> ResponseEntity.noContent().build());
    }
}