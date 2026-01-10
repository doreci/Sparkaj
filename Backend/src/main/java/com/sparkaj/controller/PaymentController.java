package com.sparkaj.controller;

import com.sparkaj.model.Oglas;
import com.sparkaj.service.OglasService;
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

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    public PaymentController(OglasService oglasService) {
        this.oglasService = oglasService;
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
                                    .setCurrency("usd")
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
}