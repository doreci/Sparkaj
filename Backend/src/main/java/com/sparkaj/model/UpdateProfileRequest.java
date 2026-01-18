package com.sparkaj.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UpdateProfileRequest {
    private String ime;
    private String prezime;

    @JsonProperty("broj_mobitela")
    private String brojMobitela;

    @JsonProperty("profile_image_url")
    private String profileImageUrl;

    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String ime, String prezime, String brojMobitela, String profileImageUrl) {
        this.ime = ime;
        this.prezime = prezime;
        this.brojMobitela = brojMobitela;
        this.profileImageUrl = profileImageUrl;
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

    public String getBrojMobitela() {
        return brojMobitela;
    }

    public void setBrojMobitela(String brojMobitela) {
        this.brojMobitela = brojMobitela;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
}
