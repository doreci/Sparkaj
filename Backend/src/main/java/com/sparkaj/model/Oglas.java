package com.sparkaj.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sparkaj.model.Korisnik;

public class Oglas {

    @JsonProperty("id_oglasa")
    private Integer idOglasa;

    @JsonProperty("naziv_oglasa")
    private String nazivOglasa;

    @JsonProperty("opis_oglasa")
    private String opisOglasa;

    private Double cijena;

    @JsonProperty("prosj_ocjena")
    private Double prosjOcjena;

    @JsonProperty("grad")
    private String grad;

    @JsonProperty("ulica_broj")
    private String ulicaBroj;

    @JsonProperty("postanski_broj")
    private Integer postanskiBroj;

    private String slika;

    @JsonProperty("id_korisnika")
    private Integer idKorisnika;

    @JsonProperty("korisnik")
    public Korisnik korisnik;

    public Oglas() {}

    public Oglas(String nazivOglasa, String opisOglasa, Double cijena, String grad, String ulicaBroj, Integer postanskiBroj, Integer idKorisnika, String slika) {
        this.nazivOglasa = nazivOglasa;
        this.opisOglasa = opisOglasa;
        this.cijena = cijena;
        this.grad = grad;
        this.ulicaBroj = ulicaBroj;
        this.postanskiBroj = postanskiBroj;
        this.idKorisnika = idKorisnika;
        this.slika = slika;
    }

    @JsonProperty("korisnik")
    public Korisnik getKorisnik(){
        return korisnik;
    }

    public void setKorisnik(Korisnik korisnik) {
        this.korisnik = korisnik;
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

    public String getGrad() {
        return grad;
    }

    public void setGrad(String grad) {
        this.grad = grad;
    }

    public String getUlicaBroj() {
        return ulicaBroj;
    }

    public void setUlicaBroj(String ulicaBroj) {
        this.ulicaBroj = ulicaBroj;
    }

    public Integer getPostanskiBroj() {
        return postanskiBroj;
    }

    public void setPostanskiBroj(Integer postanskiBroj) {
        this.postanskiBroj = postanskiBroj;
    }

    public String getSlika() {
        return slika;
    }

    public void setSlika(String slika) {
        this.slika = slika;
    }

    public Integer getIdKorisnika() {
        return idKorisnika;
    }

    public void setIdKorisnika(Integer idKorisnika) {
        this.idKorisnika = idKorisnika;
    }
}