package com.sparkaj.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Korisnik {
    @JsonProperty("id_korisnika")
    private int idKorisnika;

    private String ime;

    private String prezime;

    private String email;

    @JsonProperty("broj_mobitela")
    private int brojMobitela;

    private String profilna;

    private String uuid;

    public Korisnik() {}

    public Korisnik(int idKorisnika, String ime, String prezime, String email, int brojMobitela, String profilna) {
        this.ime = ime;
        this.prezime = prezime;
        this.email = email;
        this.brojMobitela = brojMobitela;
    }

    public int getIdKorisnika() {
        return idKorisnika;
    }

    public void setIdKorisnika(int idKorisnika) {
        this.idKorisnika = idKorisnika;
    }

    public String getIme() {
        return ime;
    }

    public void setIme(String ime) {
        this.ime = ime;
    }

    public String getPrezime() {
        return prezime;
    }

    public void setPrezime(String prezime) {
        this.prezime = prezime;
    }
    
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public int getBrojMobitela() {
        return brojMobitela;
    }

    public void setBrojMobitela(int brojMobitela) {
        this.brojMobitela = brojMobitela;
    }

    public String getProfilna() {
        return profilna;
    }

    public void setProfilna(String profilna) {
        this.profilna = profilna;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }
}

