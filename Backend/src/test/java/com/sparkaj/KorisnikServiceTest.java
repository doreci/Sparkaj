package com.sparkaj;

import com.sparkaj.service.KorisnikService;
import com.sparkaj.model.Korisnik;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.util.UUID;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class KorisnikServiceTest {

    @Autowired
    private WebClient supabaseWebClient;

    private KorisnikService korisnikService;

    @BeforeEach
    void setup() {
        korisnikService = new KorisnikService(supabaseWebClient);
    }

    

    @Test
    void testCreateKorisnik_uspjesno() throws Exception {
        String uniqueEmail = "korisnik_" + System.currentTimeMillis() + "@example.com";
        String ime = "Marko";
        String prezime = "Marković";
        String profilna = "https://example.com/profile.jpg";
        String uuid = UUID.randomUUID().toString();

        var method = KorisnikService.class.getDeclaredMethod(
                "createOAuth2Korisnik", String.class, String.class, String.class, String.class, String.class
        );
        method.setAccessible(true);

        // Poziv metode za kreiranje korisnika
        Mono<Void> mono = (Mono<Void>) method.invoke(
                korisnikService, uniqueEmail, ime, prezime, profilna, uuid
        );

        assertDoesNotThrow(() -> mono.block());

        Korisnik kreiraKorisnik = korisnikService.getKorisnikByEmail(uniqueEmail).block();

        assertNotNull(kreiraKorisnik);
        assertEquals(uniqueEmail, kreiraKorisnik.getEmail());
        assertEquals(ime, kreiraKorisnik.getIme());
        assertEquals(prezime, kreiraKorisnik.getPrezime());
        assertEquals(uuid, kreiraKorisnik.getUuid());
    }

    @Test
    void testCreateKorisnik_sa_null_poljima() throws Exception {
        String uniqueEmail = "nulltest_" + System.currentTimeMillis() + "@example.com";
        String ime = "Petar";
        String prezime = null;
        String profilna = null;
        String uuid = UUID.randomUUID().toString();

        var method = KorisnikService.class.getDeclaredMethod(
                "createOAuth2Korisnik", String.class, String.class, String.class, String.class, String.class
        );
        method.setAccessible(true);

        // Poziv metode za kreiranje korisnika
        Mono<Void> mono = (Mono<Void>) method.invoke(
                korisnikService, uniqueEmail, ime, prezime, profilna, uuid
        );

        assertDoesNotThrow(() -> mono.block());

        Korisnik kreiraKorisnik = korisnikService.getKorisnikByEmail(uniqueEmail).block();

        assertNotNull(kreiraKorisnik);
        assertEquals(uniqueEmail, kreiraKorisnik.getEmail());
        assertEquals(ime, kreiraKorisnik.getIme());
        assertNotNull(kreiraKorisnik.getUuid());
    }

    @Test
    void testGetKorisnikByEmail() throws Exception {
        String uniqueEmail = "get_" + System.currentTimeMillis() + "@example.com";
        String ime = "Ana";
        String prezime = "Anić";
        String profilna = "https://example.com/ana.jpg";
        String uuid = UUID.randomUUID().toString();

        var createMethod = KorisnikService.class.getDeclaredMethod(
                "createOAuth2Korisnik", String.class, String.class, String.class, String.class, String.class
        );
        createMethod.setAccessible(true);

        Mono<Void> mono = (Mono<Void>) createMethod.invoke(
                korisnikService, uniqueEmail, ime, prezime, profilna, uuid
        );

        assertDoesNotThrow(() -> mono.block());

        Korisnik pronadeniKorisnik = korisnikService.getKorisnikByEmail(uniqueEmail).block();

        assertNotNull(pronadeniKorisnik);
        assertEquals(uniqueEmail, pronadeniKorisnik.getEmail());
        assertEquals(ime, pronadeniKorisnik.getIme());
        assertEquals(uuid, pronadeniKorisnik.getUuid());
    }
}
