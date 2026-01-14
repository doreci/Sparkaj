package com.sparkaj.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class Transakcija {

    @JsonProperty("id_transakcija")
    private String idTransakcija;

    @JsonProperty("id_rezervacije")
    private Long idRezervacije;

    @JsonProperty("iznos")
    private Float iznos;

    @JsonProperty("datum_transakcije")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime datumTransakcije;

    @JsonProperty("placeno")
    private Boolean placeno;

    // Constructors
    public Transakcija() {
    }

    public Transakcija(String idTransakcija, Long idRezervacije, Float iznos, LocalDateTime datumTransakcije, Boolean placeno) {
        this.idTransakcija = idTransakcija;
        this.idRezervacije = idRezervacije;
        this.iznos = iznos;
        this.datumTransakcije = datumTransakcije;
        this.placeno = placeno;
    }

    // Getters and Setters
    public String getIdTransakcija() {
        return idTransakcija;
    }

    public void setIdTransakcija(String idTransakcija) {
        this.idTransakcija = idTransakcija;
    }

    public Long getIdRezervacije() {
        return idRezervacije;
    }

    public void setIdRezervacije(Long idRezervacije) {
        this.idRezervacije = idRezervacije;
    }

    public Double getIznos() {
        return iznos != null ? iznos.doubleValue() : null;
    }

    public void setIznos(Float iznos) {
        this.iznos = iznos;
    }

    public LocalDateTime getDatumTransakcije() {
        return datumTransakcije;
    }

    public void setDatumTransakcije(LocalDateTime datumTransakcije) {
        this.datumTransakcije = datumTransakcije;
    }

    public Boolean getPlaceno() {
        return placeno;
    }

    public void setPlaceno(Boolean placeno) {
        this.placeno = placeno;
    }

    @Override
    public String toString() {
        return "Transakcija{" +
                "idTransakcija='" + idTransakcija + '\'' +
                ", idRezervacije=" + idRezervacije +
                ", iznos=" + iznos +
                ", datumTransakcije=" + datumTransakcije +
                ", placeno=" + placeno +
                '}';
    }
}

