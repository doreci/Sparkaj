package com.sparkaj.model;

import java.util.List;

public class PaymentConfirmationRequest {
    private String paymentIntentId;
    private Integer oglasId;
    private Long korisnikId;
    private Double iznos;
    private List<String> selectedSlots;
    private Double cijena;

    // Constructors
    public PaymentConfirmationRequest() {
    }

    public PaymentConfirmationRequest(String paymentIntentId, Integer oglasId, Long korisnikId, Double iznos) {
        this.paymentIntentId = paymentIntentId;
        this.oglasId = oglasId;
        this.korisnikId = korisnikId;
        this.iznos = iznos;
    }

    // Getters and Setters
    public String getPaymentIntentId() {
        return paymentIntentId;
    }

    public void setPaymentIntentId(String paymentIntentId) {
        this.paymentIntentId = paymentIntentId;
    }

    public Integer getOglasId() {
        return oglasId;
    }

    public void setOglasId(Integer oglasId) {
        this.oglasId = oglasId;
    }

    public Long getKorisnikId() {
        return korisnikId;
    }

    public void setKorisnikId(Long korisnikId) {
        this.korisnikId = korisnikId;
    }

    public Double getIznos() {
        return iznos;
    }

    public void setIznos(Double iznos) {
        this.iznos = iznos;
    }

    public List<String> getSelectedSlots() {
        return selectedSlots;
    }

    public void setSelectedSlots(List<String> selectedSlots) {
        this.selectedSlots = selectedSlots;
    }

    public Double getCijena() {
        return cijena;
    }

    public void setCijena(Double cijena) {
        this.cijena = cijena;
    }
}
