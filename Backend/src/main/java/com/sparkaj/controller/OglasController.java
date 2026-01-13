package com.sparkaj.controller;

import com.sparkaj.model.Oglas;
import com.sparkaj.service.OglasService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.List;

@RestController
@RequestMapping("/api/oglasi")
@CrossOrigin(origins = "${cors.allowed-origins}")
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
    public Mono<ResponseEntity<List<Oglas>>> getOglasId(@PathVariable("id") Long id) {
        return oglasService.getOglasId(id)
                .map(ResponseEntity::ok);
    }
    
    @PostMapping
    public Mono<ResponseEntity<List<Oglas>>> kreirajOglas(@RequestBody Oglas oglas) {
        return oglasService.kreirajOglas(oglas)
                .map(ResponseEntity::ok);
    }
    
    @PutMapping("/{id}")
    public Mono<ResponseEntity<List<Oglas>>> azurirajOglas(@PathVariable("id") Long id, @RequestBody Oglas oglas) {
        return oglasService.azurirajOglas(id, oglas)
                .map(ResponseEntity::ok);
    }
    
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<List<Oglas>>> obrisiOglas(@PathVariable("id") Long id) {
        return oglasService.obrisiOglas(id)
                .map(ResponseEntity::ok);
    }
}