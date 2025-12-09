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

    @GetMapping
    public Mono<ResponseEntity<List<Oglas>>> getAllOglasi() {
        return oglasService.getAllOglasi()
                .map(ResponseEntity::ok);
    }
}