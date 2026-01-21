package com.sparkaj.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateOglasRequest {

    @JsonProperty("naziv_oglasa")
    private String nazivOglasa;

    @JsonProperty("opis_oglasa")
    private String opisOglasa;

    private Double cijena;

    @JsonProperty("grad")
    private String grad;

    @JsonProperty("ulica_broj")
    private String ulicaBroj;

    @JsonProperty("postanski_broj")
    private Integer postanskiBroj;

    private String slika;

    public UpdateOglasRequest() {}

    public UpdateOglasRequest(String nazivOglasa, String opisOglasa, Double cijena, 
                            String grad, String ulicaBroj, Integer postanskiBroj, String slika) {
        this.nazivOglasa = nazivOglasa;
        this.opisOglasa = opisOglasa;
        this.cijena = cijena;
        this.grad = grad;
        this.ulicaBroj = ulicaBroj;
        this.postanskiBroj = postanskiBroj;
        this.slika = slika;
    }

    // Getters and Setters
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

    @Override
    public String toString() {
        return "UpdateOglasRequest{" +
                "nazivOglasa='" + nazivOglasa + '\'' +
                ", opisOglasa='" + opisOglasa + '\'' +
                ", cijena=" + cijena +
                ", grad='" + grad + '\'' +
                ", ulicaBroj='" + ulicaBroj + '\'' +
                ", postanskiBroj=" + postanskiBroj +
                ", slika='" + slika + '\'' +
                '}';
    }
}
