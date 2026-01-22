package com.sparkaj;

import com.sparkaj.service.RecenzijaService;
import com.sparkaj.model.Recenzija;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersUriSpec;
import org.springframework.web.reactive.function.client.WebClient.ResponseSpec;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class RecenzijaServiceTest {

    @Autowired
    private WebClient supabaseWebClient;

    private WebClient mockWebClient;
    private RecenzijaService recenzijaService;

    @BeforeEach
    void setup() {
        mockWebClient = mock(WebClient.class);
        recenzijaService = new RecenzijaService(supabaseWebClient);
    }

    @Test
    void testGetRecenzijeByIdKorisnika() {
        Integer idKorisnika = 1;

        Mono<List<Recenzija>> recenzijeMono = recenzijaService.getRecenzijeByIdKorisnika(idKorisnika);
        List<Recenzija> recenzije = recenzijeMono.block();

        assertNotNull(recenzije);
        assertTrue(recenzije.size() >= 0);
    }

    @Test
    void testGetRecenzijeByIdKorisnika_ne_postoji() {
        Integer nePostojeciIdKorisnika = 99999;

        Mono<List<Recenzija>> recenzijeMono = recenzijaService.getRecenzijeByIdKorisnika(nePostojeciIdKorisnika);
        List<Recenzija> recenzije = recenzijeMono.block();

        assertNotNull(recenzije);
        assertEquals(0, recenzije.size());
    }

    @Test
    void testGetRecenzijeByIdKorisnika_provjeraOcjene() {
        Integer idKorisnika = 1;

        Mono<List<Recenzija>> recenzijeMono = recenzijaService.getRecenzijeByIdKorisnika(idKorisnika);
        List<Recenzija> recenzije = recenzijeMono.block();

        assertNotNull(recenzije);
        for (Recenzija recenzija : recenzije) {
            assertNotNull(recenzija.getOcjena());
            assertNotNull(recenzija.getIdRecenzije());
            assertNotNull(recenzija.getIdRezervacije());
            assertTrue(recenzija.getOcjena() >= 1 && recenzija.getOcjena() <= 5);
        }
    }
}
