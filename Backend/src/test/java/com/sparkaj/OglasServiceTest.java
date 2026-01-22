package com.sparkaj;

import com.sparkaj.service.OglasService;
import com.sparkaj.service.KorisnikService;
import com.sparkaj.model.Oglas;
import com.sparkaj.model.CreateOglasRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class OglasServiceTest {

    @Autowired
    private WebClient supabaseWebClient;

    @Autowired
    private KorisnikService korisnikService;

    private OglasService oglasService;

    @BeforeEach
    void setup() {
        oglasService = new OglasService(supabaseWebClient, korisnikService);
    }

    @Test
    void testGetOglasById_ne_postoji() {
        Integer nePostojeciId = 99999;

        Oglas oglas = oglasService.getOglasById(nePostojeciId).block();

        assertNull(oglas);
    }

    @Test
    void testGetAllOglasi() {
        Mono<List<Oglas>> oglasiMono = oglasService.getAllOglasi();
        List<Oglas> oglasi = oglasiMono.block();

        assertNotNull(oglasi);
        assertTrue(oglasi.size() >= 0);
    }

    @Test
    void testCreateOglas_sa_id_korisnika() {
        CreateOglasRequest request = new CreateOglasRequest();
        request.setNazivOglasa("Test Parking " + System.currentTimeMillis());
        request.setOpisOglasa("Opis test parkinga");
        request.setCijena(50.0);
        request.setGrad("Zagreb");
        request.setUlicaBroj("Ulica 123");
        request.setPostanskiBroj(10000);
        request.setIdKorisnika(1); // ID postojećeg korisnika u bazi
        request.setSlika("https://example.com/parking.jpg");

        Mono<Oglas> oglasCreatedMono = oglasService.createOglas(request);
        Oglas kreiranOglas = oglasCreatedMono.block();

        assertNotNull(kreiranOglas);
        assertEquals(request.getNazivOglasa(), kreiranOglas.getNazivOglasa());
        assertEquals(request.getCijena(), kreiranOglas.getCijena());
        assertEquals(request.getGrad(), kreiranOglas.getGrad());
        assertNotNull(kreiranOglas.getIdOglasa());
    }

    @Test
    void testGetOglasiByKorisnikId() {
        Integer idKorisnika = 1;

        Mono<List<Oglas>> oglaseMono = oglasService.getOglasiByKorisnikId(idKorisnika);
        List<Oglas> oglasi = oglaseMono.block();

        assertNotNull(oglasi);

        // Ako korisnik ima oglase, provjerimo da svi imaju ispravan ID korisnika
        for (Oglas oglas : oglasi) {
            assertEquals(idKorisnika, oglas.getIdKorisnika());
        }
    }

    @Test
    void testGetOglasiByKorisnikId_ne_postoji() {
        Integer nePostojeciIdKorisnika = 99999;

        Mono<List<Oglas>> oglaseMono = oglasService.getOglasiByKorisnikId(nePostojeciIdKorisnika);
        List<Oglas> oglasi = oglaseMono.block();

        assertNotNull(oglasi);
        assertEquals(0, oglasi.size());
    }

    @Test
    void testGetLokacije() {
        var lokacije = (Mono<List<Object>>) (Object) oglasService.getLokacije().block();

        assertNotNull(lokacije);
    }

    @Test
    void testGetOglasById_postoji() {
        CreateOglasRequest request = new CreateOglasRequest();
        request.setNazivOglasa("Test Parking 2 " + System.currentTimeMillis());
        request.setOpisOglasa("Opis za test2");
        request.setCijena(75.0);
        request.setGrad("Rijeka");
        request.setUlicaBroj("Ulica 456");
        request.setPostanskiBroj(12345);
        request.setIdKorisnika(1);
        request.setSlika("https://example.com/parking2.jpg");

        Mono<Oglas> oglasCreatedMono = oglasService.createOglas(request);
        Oglas kreiranOglas = oglasCreatedMono.block();

        assertNotNull(kreiranOglas);
        Integer oglasId = kreiranOglas.getIdOglasa();

        Mono<Oglas> pronadeniOglasMono = oglasService.getOglasById(oglasId);
        Oglas pronadeniOglas = pronadeniOglasMono.block();

        assertNotNull(pronadeniOglas);
        assertEquals(oglasId, pronadeniOglas.getIdOglasa());
        assertEquals(request.getNazivOglasa(), pronadeniOglas.getNazivOglasa());
    }
}
