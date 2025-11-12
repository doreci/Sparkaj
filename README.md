# Programsko inženjerstvo
# Opis projekta
Ovaj projekt je rezultat timskog rada u sklopu projeknog zadatka kolegija [Programsko inženjerstvo](https://www.fer.unizg.hr/predmet/proinz) na Fakultetu elektrotehnike i računarstva Sveučilišta u Zagrebu. 

Cilj projekta je razviti web platformu koja povezuje vlasnike privatnih parkirnih mjesta s korisnicima koji traže parking. Na taj način rješava se problem nedostatka parkirnih mjesta i gubitka vremena pri traženju slobodnog mjesta. Motivacija za projekt proizlazi iz želje da se proces najma parkirnih mjesta digitalizira i učini jednostavnijim, sigurnijim i bržim.

Kroz rad na projektu naučili smo kako integrirati različite tehnologije, poput Reacta, Springa, OAuth 2.0, Google Mapsa i Stripea, te kako frontend i backend surađuju u cjelovitom sustavu. Projekt nam je omogućio da steknemo praktično iskustvo u izradi modernih web aplikacija i razumijemo važnost sigurnosti i pouzdanosti sustava.

# Funkcijski zahtjevi
Sustav omogućuje registraciju i prijavu putem OAuth 2.0 autentifikacije, čime se osigurava siguran pristup aplikaciji. Vlasnici parkirnih mjesta mogu kreirati, uređivati i brisati oglase, dok korisnici imaju mogućnost pregledavanja i filtriranja oglasa prema lokaciji, cijeni i dostupnosti.

Korisnici mogu rezervirati parkirno mjesto i izvršiti plaćanje putem Stripe API-ja, čime se omogućuje sigurna i brza transakcija. Nakon korištenja usluge, korisnici mogu ostaviti ocjenu i recenziju za parkirno mjesto, a na profilima oglašivača prikazuju se svi njihovi aktivni oglasi i prosječna ocjena.

Administrator ima mogućnost upravljanja korisničkim računima i moderiranja oglasa, uključujući provjeru, odobravanje ili uklanjanje sadržaja te reagiranje na prijave nepravilnosti. Sustav također omogućuje korisnicima promjenu ili oporavak lozinke, kao i pregled povijesti transakcija.


# Tehnologije
Operativni sustav: Linux (Render hosting)

Poslužiteljska strana: Supabase

Frontend: React.js

Backend: Spring Boot, Java 21


# Članovi tima 
Dorian Ceci
Tonka Heckel
Luka Oslić
Marko Kovačev
Karlo Piškorić
Lovro Klanac
Sven Oužecky


# Kontribucije
>Pravila ovise o organizaciji tima i su često izdvojena u CONTRIBUTING.md



# 📝 Kodeks ponašanja [![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
Kao studenti sigurno ste upoznati s minimumom prihvatljivog ponašanja definiran u [KODEKS PONAŠANJA STUDENATA FAKULTETA ELEKTROTEHNIKE I RAČUNARSTVA SVEUČILIŠTA U ZAGREBU](https://www.fer.hr/_download/repository/Kodeks_ponasanja_studenata_FER-a_procisceni_tekst_2016%5B1%5D.pdf), te dodatnim naputcima za timski rad na predmetu [Programsko inženjerstvo](https://wwww.fer.hr).
Očekujemo da ćete poštovati [etički kodeks IEEE-a](https://www.ieee.org/about/corporate/governance/p7-8.html) koji ima važnu obrazovnu funkciju sa svrhom postavljanja najviših standarda integriteta, odgovornog ponašanja i etičkog ponašanja u profesionalnim aktivnosti. Time profesionalna zajednica programskih inženjera definira opća načela koja definiranju  moralni karakter, donošenje važnih poslovnih odluka i uspostavljanje jasnih moralnih očekivanja za sve pripadnike zajenice.

Kodeks ponašanja skup je provedivih pravila koja služe za jasnu komunikaciju očekivanja i zahtjeva za rad zajednice/tima. Njime se jasno definiraju obaveze, prava, neprihvatljiva ponašanja te  odgovarajuće posljedice (za razliku od etičkog kodeksa). U ovom repozitoriju dan je jedan od široko prihvačenih kodeks ponašanja za rad u zajednici otvorenog koda.


# 📝 Licenca
Važeča (1)
[![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

Ovaj repozitorij sadrži otvoreni obrazovni sadržaji (eng. Open Educational Resources)  i licenciran je prema pravilima Creative Commons licencije koja omogućava da preuzmete djelo, podijelite ga s drugima uz 
uvjet da navođenja autora, ne upotrebljavate ga u komercijalne svrhe te dijelite pod istim uvjetima [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License HR][cc-by-nc-sa].
>
> ### Napomena:
>
> Svi paketi distribuiraju se pod vlastitim licencama.
> Svi upotrijebleni materijali  (slike, modeli, animacije, ...) distribuiraju se pod vlastitim licencama.

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: https://creativecommons.org/licenses/by-nc/4.0/deed.hr 
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg

Orginal [![cc0-1.0][cc0-1.0-shield]][cc0-1.0]
>
>COPYING: All the content within this repository is dedicated to the public domain under the CC0 1.0 Universal (CC0 1.0) Public Domain Dedication.
>
[![CC0-1.0][cc0-1.0-image]][cc0-1.0]

[cc0-1.0]: https://creativecommons.org/licenses/by/1.0/deed.en
[cc0-1.0-image]: https://licensebuttons.net/l/by/1.0/88x31.png
[cc0-1.0-shield]: https://img.shields.io/badge/License-CC0--1.0-lightgrey.svg

### Reference na licenciranje repozitorija