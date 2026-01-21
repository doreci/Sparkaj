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

        Mono<Oglas> oglasOpt = oglasService.getOglasById(nePostojeciId);
        Oglas oglas = oglasOpt.block();

        assertNull(oglas);
    }

    @Test
    void testGetAllOglasi() {
        Mono<List<Oglas>> oglaseMono = oglasService.getAllOglasi();
        List<Oglas> oglasi = oglaseMono.block();

        assertNotNull(oglasi);
        assertTrue(oglasi.size() >= 0);
    }

    @Test
    void testCreateOglas_sa_id_korisnika() {
        // Priprema - kreiraj oglas sa ID korisnika (direktno)
        CreateOglasRequest request = new CreateOglasRequest();
        request.setNazivOglasa("Test Parking " + System.currentTimeMillis());
        request.setOpisOglasa("Opis test parkinga");
        request.setCijena(50.0);
        request.setGrad("Sarajevo");
        request.setUlicaBroj("Ulica 123");
        request.setPostanskiBroj(71000);
        request.setIdKorisnika(1); // ID postojećeg korisnika u bazi
        request.setSlika("https://example.com/parking.jpg");

        // Testiranje - kreiranje oglasa
        Mono<Oglas> oglasCreatedMono = oglasService.createOglas(request);
        Oglas kreiranOglas = oglasCreatedMono.block();

        // Verifikacija
        assertNotNull(kreiranOglas, "Oglas bi trebao biti kreiran");
        assertEquals(request.getNazivOglasa(), kreiranOglas.getNazivOglasa(), "Naziv bi trebao biti isti");
        assertEquals(request.getCijena(), kreiranOglas.getCijena(), "Cijena bi trebala biti ista");
        assertEquals(request.getGrad(), kreiranOglas.getGrad(), "Grad bi trebao biti isti");
        assertNotNull(kreiranOglas.getIdOglasa(), "ID oglasa bi trebao biti generisan");
        System.out.println("[testCreateOglas_sa_id_korisnika] Oglas kreiran sa ID: " + kreiranOglas.getIdOglasa());
    }

    @Test
    void testGetOglasiByKorisnikId() {
        // Testiranje - dohvat svih oglasa za specifičnog korisnika
        Integer idKorisnika = 1;

        // Izvršavanje
        Mono<List<Oglas>> oglaseMono = oglasService.getOglasiByKorisnikId(idKorisnika);
        List<Oglas> oglasi = oglaseMono.block();

        // Verifikacija
        assertNotNull(oglasi, "Lista oglasa ne bi trebala biti null");
        System.out.println("[testGetOglasiByKorisnikId] Korisnik " + idKorisnika + " ima " + oglasi.size() + " oglasa");

        // Ako korisnik ima oglase, provjerimo da svi imaju ispravan ID korisnika
        for (Oglas oglas : oglasi) {
            assertEquals(idKorisnika, oglas.getIdKorisnika(), "Svi oglasi trebali bi biti korisnika " + idKorisnika);
        }
    }

    @Test
    void testGetOglasiByKorisnikId_ne_postoji() {
        // Testiranje - dohvat oglasa za korisnika koji ne postoji
        Integer nePostojeciIdKorisnika = 99999;

        // Izvršavanje
        Mono<List<Oglas>> oglaseMono = oglasService.getOglasiByKorisnikId(nePostojeciIdKorisnika);
        List<Oglas> oglasi = oglaseMono.block();

        // Verifikacija - trebalo bi da bude prazna lista
        assertNotNull(oglasi, "Lista bi trebala biti prazna, ne null");
        assertEquals(0, oglasi.size(), "Lista bi trebala biti prazna jer korisnik ne postoji");
        System.out.println("[testGetOglasiByKorisnikId_ne_postoji] Pronađeno oglasa za nepostojeći korisnik: " + oglasi.size());
    }

    @Test
    void testGetLokacije() {
        // Testiranje - dohvat svih dostupnih lokacija (gradova)
        Mono<List<Object>> lokacijeMono = (Mono<List<Object>>) (Object) oglasService.getLokacije();
        var lokacije = lokacijeMono.block();

        // Verifikacija
        assertNotNull(lokacije, "Lista lokacija ne bi trebala biti null");
        System.out.println("[testGetLokacije] Pronađeno lokacija: " + lokacije.size());
    }

    @Test
    void testGetOglasById_postoji() {
        // Priprema - prvo kreiraj oglas
        CreateOglasRequest request = new CreateOglasRequest();
        request.setNazivOglasa("Test Parking " + System.currentTimeMillis());
        request.setOpisOglasa("Opis za test");
        request.setCijena(75.0);
        request.setGrad("Mostar");
        request.setUlicaBroj("Ulica 456");
        request.setPostanskiBroj(88000);
        request.setIdKorisnika(1);
        request.setSlika("https://example.com/parking2.jpg");

        // Kreiraj oglas
        Mono<Oglas> oglasCreatedMono = oglasService.createOglas(request);
        Oglas kreiranOglas = oglasCreatedMono.block();

        assertNotNull(kreiranOglas, "Oglas bi trebao biti kreiran");
        Integer oglasId = kreiranOglas.getIdOglasa();

        // Testiranje - dohvat kreiranog oglasa po ID-u
        Mono<Oglas> pronađeniOglasMono = oglasService.getOglasById(oglasId);
        Oglas pronađeniOglas = pronađeniOglasMono.block();

        // Verifikacija
        assertNotNull(pronađeniOglas, "Oglas bi trebao biti pronađen");
        assertEquals(oglasId, pronađeniOglas.getIdOglasa(), "ID oglasa bi trebao biti isti");
        assertEquals(request.getNazivOglasa(), pronađeniOglas.getNazivOglasa(), "Naziv bi trebao biti isti");
        System.out.println("[testGetOglasById_postoji] Oglas pronađen: " + pronađeniOglas.getNazivOglasa());
    }
}
