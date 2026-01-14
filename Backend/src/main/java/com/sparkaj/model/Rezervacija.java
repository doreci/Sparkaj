package com.sparkaj.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Rezervacija {

    @JsonProperty("id_rezervacije")
    private Long idRezervacije;

    @JsonProperty("id_korisnika")
    private Long idKorisnika;

    @JsonProperty("id_oglasa")
    private Long idOglasa;

    @JsonProperty("datumOd")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime datumOd;

    @JsonProperty("datumDo")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime datumDo;

    // Constructors
    public Rezervacija() {
    }

    public Rezervacija(Long idRezervacije, Long idKorisnika, Long idOglasa, LocalDateTime datumOd, LocalDateTime datumDo) {
        this.idRezervacije = idRezervacije;
        this.idKorisnika = idKorisnika;
        this.idOglasa = idOglasa;
        this.datumOd = datumOd;
        this.datumDo = datumDo;
    }

    // Getters and Setters
    public Long getIdRezervacije() {
        return idRezervacije;
    }

    public void setIdRezervacije(Long idRezervacije) {
        this.idRezervacije = idRezervacije;
    }

    public Long getIdKorisnika() {
        return idKorisnika;
    }

    public void setIdKorisnika(Long idKorisnika) {
        this.idKorisnika = idKorisnika;
    }

    public Long getIdOglasa() {
        return idOglasa;
    }

    public void setIdOglasa(Long idOglasa) {
        this.idOglasa = idOglasa;
    }

    public LocalDateTime getDatumOd() {
        return datumOd;
    }

    public void setDatumOd(LocalDateTime datumOd) {
        this.datumOd = datumOd;
    }

    public LocalDateTime getDatumDo() {
        return datumDo;
    }

    public void setDatumDo(LocalDateTime datumDo) {
        this.datumDo = datumDo;
    }

    @Override
    public String toString() {
        return "Rezervacija{" +
                "idRezervacije=" + idRezervacije +
                ", idKorisnika=" + idKorisnika +
                ", idOglasa=" + idOglasa +
                ", datumOd=" + datumOd +
                ", datumDo=" + datumDo +
                '}';
    }
}

