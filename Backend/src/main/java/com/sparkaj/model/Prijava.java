package com.sparkaj.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Prijava {
    @JsonProperty("id_korisnika")
    private Integer id_korisnika;

    @JsonProperty("id_oglasa")
    private Integer id_oglasa;

    @JsonProperty("id_prijave")
    private Integer id_prijave;

    @JsonProperty("opis")
    private String opis;

    @JsonProperty("status")
    private Boolean status; // true = odrađena, false = neodrađena

    public Prijava() {
    }

    public Prijava(Integer id_korisnika, Integer id_oglasa, String opis) {
        this.id_korisnika = id_korisnika;
        this.id_oglasa = id_oglasa;
        this.opis = opis;
        this.status = false;
    }

    public Integer getId_korisnika() {
        return id_korisnika;
    }

    public void setId_korisnika(Integer id_korisnika) {
        this.id_korisnika = id_korisnika;
    }

    public Integer getId_oglasa() {
        return id_oglasa;
    }

    public void setId_oglasa(Integer id_oglasa) {
        this.id_oglasa = id_oglasa;
    }

    public Integer getId_prijave() {
        return id_prijave;
    }

    public void setId_prijave(Integer id_prijave) {
        this.id_prijave = id_prijave;
    }

    public String getOpis() {
        return opis;
    }

    public void setOpis(String opis) {
        this.opis = opis;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return "Prijava{" +
                "id_korisnika=" + id_korisnika +
                ", id_oglasa=" + id_oglasa +
                ", id_prijave=" + id_prijave +
                ", opis='" + opis + '\'' +
                ", status=" + status +
                '}';
    }
}
