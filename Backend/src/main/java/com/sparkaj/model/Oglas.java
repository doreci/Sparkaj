package com.sparkaj.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Oglas {

    @JsonProperty("id_oglasa")
    private int idOglasa;

    @JsonProperty("naziv_oglasa")
    private String nazivOglasa;

    @JsonProperty("opis_oglasa")
    private String opisOglasa;

    private double cijena;

    @JsonProperty("prosj_ocjena")
    private double prosjOcjena;

    @JsonProperty("id_korisnika")
    private int idKorisnika;

    public Oglas() {}

    public Oglas(String nazivOglasa, String opisOglasa, Double cijena, Integer idKorisnika) {
        this.nazivOglasa = nazivOglasa;
        this.opisOglasa = opisOglasa;
        this.cijena = cijena;
        this.idKorisnika = idKorisnika;
    }

    public Integer getIdOglasa() {
        return idOglasa;
    }
    public void setIdOglasa(Integer idOglasa) {
        this.idOglasa = idOglasa;
    }

    public String getNazivOglasa() {
        return nazivOglasa;
    }
    public void setNazivOglasa(String nazivOglasa) {
        this.nazivOglasa = nazivOglasa;
    }

    public String getOpisOglasa() {
        return opisOglasa;
    }
    public void setOpisOglasa(String opisOglasa) {
        this.opisOglasa = opisOglasa;
    }

    public Double getCijena() {
        return cijena;
    }
    public void setCijena(Double cijena) {
        this.cijena = cijena;
    }

    public Double getProsjOcjena() {
        return prosjOcjena;
    }
    public void setProsjOcjena(Double prosjOcjena) {
        this.prosjOcjena = prosjOcjena;
    }

    public Integer getIdKorisnika() {
        return idKorisnika;
    }
    public void setIdKorisnika(Integer idKorisnika) {
        this.idKorisnika = idKorisnika;
    }
}