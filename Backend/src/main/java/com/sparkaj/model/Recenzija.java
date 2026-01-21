package com.sparkaj.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Recenzija {
    private int ocjena;

    @JsonProperty("id_recenzije")
    private int idRecenzije;

    @JsonProperty("id_rezervacije")
    private int idRezervacije;

    public Recenzija(int ocjena, int idRecenzije, int idRezervacije) {
        this.ocjena = ocjena;
        this.idRecenzije = idRecenzije;
        this.idRezervacije = idRezervacije;
    }

    public int getOcjena() {
        return ocjena;
    }

    public void setOcjena(int ocjena) {
        this.ocjena = ocjena;
    }

    public int getIdRecenzije() {
        return idRecenzije;
    }

    public void setIdRecenzije(int idRecenzije) {
        this.idRecenzije = idRecenzije;
    }

    public int getIdRezervacije() {
        return idRezervacije;
    }

    public void setIdRezervacije(int idRezervacije) {
        this.idRezervacije = idRezervacije;
    }
}
