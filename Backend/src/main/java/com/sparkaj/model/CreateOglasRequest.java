package com.sparkaj.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CreateOglasRequest {

    @JsonProperty("naziv_oglasa")
    private String nazivOglasa;

    @JsonProperty("opis_oglasa")
    private String opisOglasa;

    private Double cijena;

    private String grad;

    @JsonProperty("ulica_broj")
    private String ulicaBroj;

    @JsonProperty("postanski_broj")
    private Integer postanskiBroj;

    private String slika;

    private String uuid; // Supabase user UUID

    @JsonProperty("id_korisnika")
    private Integer idKorisnika; // Spring Boot OAuth2 korisnik ID

    // Getters and setters

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

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public Integer getIdKorisnika() {
        return idKorisnika;
    }

    public void setIdKorisnika(Integer idKorisnika) {
        this.idKorisnika = idKorisnika;
    }
}