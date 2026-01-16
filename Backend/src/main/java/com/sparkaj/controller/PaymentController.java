package com.sparkaj.controller;

import com.sparkaj.model.PaymentConfirmationRequest;
import com.sparkaj.service.OglasService;
import com.sparkaj.service.TransakcijaService;
import com.sparkaj.service.RezervacijaService;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class PaymentController {

    private final OglasService oglasService;
    private final TransakcijaService transakcijaService;
    private final RezervacijaService rezervacijaService;

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    public PaymentController(OglasService oglasService, TransakcijaService transakcijaService, RezervacijaService rezervacijaService) {
        this.oglasService = oglasService;
        this.transakcijaService = transakcijaService;
        this.rezervacijaService = rezervacijaService;
    }

    @PostMapping("/create-payment-intent")
    public Mono<ResponseEntity<?>> createPaymentIntent(@RequestBody Map<String, Object> request) {
        try {
            Object oglasIdObj = request.get("oglasId");
            if (oglasIdObj == null) {
                return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing oglasId"));
            }
            
            Integer oglasId;
            if (oglasIdObj instanceof Integer) {
                oglasId = (Integer) oglasIdObj;
            } else if (oglasIdObj instanceof String) {
                try {
                    oglasId = Integer.parseInt((String) oglasIdObj);
                } catch (NumberFormatException e) {
                    return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid oglasId format"));
                }
            } else {
                return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid oglasId type"));
            }
            
            System.out.println("Creating payment intent for oglasId: " + oglasId);
            System.out.println("Stripe secret key configured: " + (stripeSecretKey != null ? "YES" : "NO"));
            
            return oglasService.getOglasById(oglasId)
                    .flatMap(oglas -> {
                        try {
                            if (oglas.getCijena() == null) {
                                return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Oglas price is null"));
                            }
                            
                            if (stripeSecretKey == null || stripeSecretKey.isEmpty()) {
                                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Stripe configuration error"));
                            }
                            
                            Stripe.apiKey = stripeSecretKey;

                            long amount = (long) (oglas.getCijena() * 100); // Convert to cents

                            if (amount <= 0) {
                                return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payment amount"));
                            }

                            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                                    .setAmount(amount)
                                    .setCurrency("eur")
                                    .build();

                            PaymentIntent paymentIntent = PaymentIntent.create(params);

                            Map<String, Object> response = new HashMap<>();
                            response.put("clientSecret", paymentIntent.getClientSecret());
                            response.put("paymentIntentId", paymentIntent.getId());

                            return Mono.just(ResponseEntity.ok(response));
                        } catch (Exception e) {
                            Map<String, Object> errorResponse = new HashMap<>();
                            errorResponse.put("error", e.getMessage());
                            return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse));
                        }
                    })
                    .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Oglas not found")));
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse));
        }
    }

    @PostMapping("/confirm-payment")
    public Mono<ResponseEntity<Object>> confirmPayment(@RequestBody PaymentConfirmationRequest request) {
        try {
            System.out.println("=== Confirm Payment Request ===");
            System.out.println("Payment Intent ID: " + request.getPaymentIntentId());
            System.out.println("Oglas ID: " + request.getOglasId());
            System.out.println("Korisnik ID: " + request.getKorisnikId());
            System.out.println("Iznos: " + request.getIznos());
            
            if (request.getPaymentIntentId() == null || request.getIznos() == null) {
                System.out.println("Missing required fields!");
                return Mono.just(new ResponseEntity<>((Object) "Missing paymentIntentId or iznos", HttpStatus.BAD_REQUEST));
            }

            if (request.getKorisnikId() == null || request.getOglasId() == null) {
                System.out.println("Missing korisnikId or oglasId!");
                return Mono.just(new ResponseEntity<>((Object) "Missing korisnikId or oglasId", HttpStatus.BAD_REQUEST));
            }

            System.out.println("Confirming payment: " + request.getPaymentIntentId());

            // Create a reservation first
            return rezervacijaService.createRezervacija(request.getKorisnikId(), request.getOglasId().longValue())
                    .flatMap(rezervacija -> {
                        if (rezervacija == null) {
                            System.err.println("Failed to create reservation");
                            return Mono.just(new ResponseEntity<>((Object) "Failed to create reservation", HttpStatus.INTERNAL_SERVER_ERROR));
                        }

                        Long reservationId = rezervacija.getIdRezervacije();
                        System.out.println("Reservation created with ID: " + reservationId);
                        System.out.println("Saving transaction with amount: " + request.getIznos());

                        // Save the transaction with the valid reservation ID
                        return transakcijaService.saveTransakcija(
                                request.getPaymentIntentId(),
                                reservationId,
                                request.getIznos()
                        ).flatMap(transakcija -> {
                            System.out.println("Transaction saved successfully: " + transakcija.getIdTransakcija());
                            Map<String, Object> response = new HashMap<>();
                            response.put("success", true);
                            response.put("transactionId", transakcija.getIdTransakcija());
                            response.put("reservationId", reservationId);
                            response.put("message", "Payment confirmed and reservation created");
                            ResponseEntity<Object> entity = new ResponseEntity<>(response, HttpStatus.OK);
                            return Mono.just(entity);
                        });
                    })
                    .onErrorResume(error -> {
                        System.err.println("Error in payment confirmation: " + error.getMessage());
                        error.printStackTrace();
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("error", "Payment confirmation failed: " + error.getMessage());
                        ResponseEntity<Object> entity = new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
                        return Mono.just(entity);
                    });

        } catch (Exception e) {
            System.err.println("Exception in confirmPayment: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return Mono.just(new ResponseEntity<>((Object) errorResponse, HttpStatus.INTERNAL_SERVER_ERROR));
        }
    }
}
