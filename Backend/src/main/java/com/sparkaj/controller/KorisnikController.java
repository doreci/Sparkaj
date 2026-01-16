package com.sparkaj.controller;

import com.sparkaj.model.Korisnik;
import com.sparkaj.model.Oglas;
import com.sparkaj.service.KorisnikService;
import com.sparkaj.service.OglasService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.List;

@RestController
@RequestMapping("/api/korisnik")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080", "http://localhost:10000", "https://sparkaj-g53p.onrender.com"})
public class KorisnikController {

    private final KorisnikService korisnikService;
    private final OglasService oglasService;

    public KorisnikController(KorisnikService korisnikService, OglasService oglasService) {
        this.korisnikService = korisnikService;
        this.oglasService = oglasService;
        System.out.println("Napravljen Korisnik Controller");
    }

    // Prikaz profila korisnika
    @GetMapping("/{idKorisnika}")
    public Mono<Korisnik> getKorisnik(@PathVariable int idKorisnika) {
        return korisnikService.getKorisnikById(idKorisnika);
    }

    // Prikazi svih oglasa jednog korisnika
    @GetMapping("/{idKorisnika}/oglasi")
    public Mono<List<Oglas>> getOglasiKorisnika(@PathVariable int idKorisnika) {
        return oglasService.getOglasiByIdKorisnika(idKorisnika);
    }
}