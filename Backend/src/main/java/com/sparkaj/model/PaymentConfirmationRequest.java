package com.sparkaj.model;

public class PaymentConfirmationRequest {
    private String paymentIntentId;
    private Integer oglasId;
    private Long korisnikId;
    private Double iznos;

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
}
