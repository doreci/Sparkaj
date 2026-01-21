package com.sparkaj.controller;

import com.sparkaj.model.Recenzija;
import com.sparkaj.service.RecenzijaService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.List;

@RestController
@RequestMapping("/api/recenzije")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:10000", "https://sparkaj-g53p.onrender.com"})


public class RecenzijaController {

    private final RecenzijaService recenzijaService;

    public RecenzijaController(RecenzijaService recenzijaService) {
        this.recenzijaService = recenzijaService;
    }

    @GetMapping("/korisnik/{idKorisnika}")
    public Mono<List<Recenzija>> getRecenzijeByIdKorisnika(@PathVariable Integer idKorisnika) {
        return recenzijaService.getRecenzijeByIdKorisnika(idKorisnika);
    }
}