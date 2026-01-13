package com.sparkaj.controller;

<<<<<<< Updated upstream
import com.sparkaj.model.GradBody;
=======
import com.sparkaj.model.CreateOglasRequest;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    public Mono<ResponseEntity<List<Oglas>>> getOglasId(@PathVariable("id") Long id) {
        return oglasService.getOglasId(id)
                .map(ResponseEntity::ok);
    }
    
    @GetMapping("/searchLokacija")
    public Mono<ResponseEntity<List<Oglas>>> pretraziOglaseLok(@RequestParam("lokacija") String lokacija) {
        return oglasService.pretraziOglaseLok(lokacija)
                .map(ResponseEntity::ok);
    }
    
    @GetMapping("/searchCijena")
    public Mono<ResponseEntity<List<Oglas>>> pretraziOglaseCij(@RequestParam("cijenaOd") String cijenaOd, @RequestParam("cijenaDo") String cijenaDo) {
        return oglasService.pretraziOglaseCij(cijenaOd, cijenaDo)
                .map(ResponseEntity::ok);
    }
    
    @GetMapping("/lokacije")
    public Mono<ResponseEntity<List<GradBody>>> getLokacije() {
        return oglasService.getLokacije()
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
=======
    public Mono<ResponseEntity<Oglas>> getOglasById(@PathVariable String id) {
        try {
            Integer intId = Integer.parseInt(id);
            return oglasService.getOglasById(intId)
                    .map(oglas -> oglas != null ? ResponseEntity.ok(oglas) : ResponseEntity.notFound().build());
        } catch (NumberFormatException e) {
            return Mono.just(ResponseEntity.badRequest().build());
        }
    }

    // Kreiranje novog oglasa
    @PostMapping
    public Mono<ResponseEntity<Oglas>> createOglas(@RequestBody CreateOglasRequest request) {
        return oglasService.createOglas(request)
>>>>>>> Stashed changes
                .map(ResponseEntity::ok);
    }
}