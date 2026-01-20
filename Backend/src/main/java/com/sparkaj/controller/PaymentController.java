package com.sparkaj.controller;

import com.sparkaj.model.PaymentConfirmationRequest;
import com.sparkaj.service.OglasService;
import com.sparkaj.service.TransakcijaService;
import com.sparkaj.service.RezervacijaService;
import com.sparkaj.service.KorisnikService;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
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
    private final KorisnikService korisnikService;

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    public PaymentController(OglasService oglasService, TransakcijaService transakcijaService, RezervacijaService rezervacijaService, KorisnikService korisnikService) {
        this.oglasService = oglasService;
        this.transakcijaService = transakcijaService;
        this.rezervacijaService = rezervacijaService;
        this.korisnikService = korisnikService;
    }

    @PostMapping("/create-payment-intent")
    public Mono<ResponseEntity<?>> createPaymentIntent(@RequestBody Map<String, Object> request) {
        try {
            // Prvo pokušaj s `amount` (za nove rezervacije)
            Object amountObj = request.get("amount");
            if (amountObj != null) {
                Long amount = null;
                if (amountObj instanceof Integer) {
                    amount = ((Integer) amountObj).longValue();
                } else if (amountObj instanceof Long) {
                    amount = (Long) amountObj;
                } else if (amountObj instanceof Double) {
                    amount = ((Double) amountObj).longValue();
                }

                if (amount != null && amount > 0) {
                    System.out.println("[PaymentController] Kreiram payment intent za iznos: " + amount + " centima");

                    try {
                        if (stripeSecretKey == null || stripeSecretKey.isEmpty()) {
                            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Stripe configuration error"));
                        }

                        Stripe.apiKey = stripeSecretKey;

                        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                                .setAmount(amount)
                                .setCurrency("eur")
                                .build();

                        PaymentIntent paymentIntent = PaymentIntent.create(params);

                        Map<String, Object> response = new HashMap<>();
                        response.put("clientSecret", paymentIntent.getClientSecret());
                        response.put("paymentIntentId", paymentIntent.getId());

                        System.out.println("[PaymentController] ✓ Payment intent kreiran: " + paymentIntent.getId());
                        return Mono.just(ResponseEntity.ok(response));
                    } catch (Exception e) {
                        System.err.println("[PaymentController] Greška: " + e.getMessage());
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("error", e.getMessage());
                        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse));
                    }
                }
            }

            // Fallback na `oglasId` (stari pristup)
            Object oglasIdObj = request.get("oglasId");
            if (oglasIdObj == null) {
                return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Missing amount or oglasId"));
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

    @GetMapping("/transaction-history/{userId}")
    public Mono<ResponseEntity<Object>> getTransactionHistory(@PathVariable Long userId) {
        System.out.println("Fetching transaction history for userId: " + userId);
        
        return transakcijaService.getTransakcijeByUserId(userId)
                .collectList()
                .map(transakcije -> {
                    System.out.println("Found " + transakcije.size() + " transactions");
                    Map<String, Object> response = new HashMap<>();
                    if (transakcije.isEmpty()) {
                        response.put("message", "Nema dostupnih transakcija");
                        response.put("transactions", transakcije);
                    } else {
                        response.put("transactions", transakcije);
                        response.put("total", transakcije.size());
                    }
                    return ResponseEntity.ok((Object) response);
                })
                .onErrorResume(error -> {
                    System.err.println("Error fetching transaction history: " + error.getMessage());
                    error.printStackTrace();
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Greška pri dohvaćanju istorije transakcija: " + error.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body((Object) errorResponse));
                });
    }

    @GetMapping("/transaction-history")
    public Mono<ResponseEntity<Object>> getMyTransactionHistory(Authentication authentication) {
        System.out.println("Fetching current user transaction history");
        
        if (authentication == null || !authentication.isAuthenticated()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Korisnik nije autentificiran");
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body((Object) errorResponse));
        }

        try {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            String email = oauth2User.getAttribute("email");
            String googleId = oauth2User.getAttribute("sub");
            
            System.out.println("Getting transactions for user: " + email + " (Google ID: " + googleId + ")");
            
            // Look up user by email to get their database ID
            return korisnikService.getKorisnikByEmail(email)
                    .flatMap(korisnik -> {
                        if (korisnik == null) {
                            System.out.println("User not found in database: " + email);
                            Map<String, Object> errorResponse = new HashMap<>();
                            errorResponse.put("error", "Korisnik nije pronađen u bazi podataka");
                            errorResponse.put("message", "Nema dostupnih transakcija");
                            errorResponse.put("transactions", new java.util.ArrayList<>());
                            return Mono.just(ResponseEntity.ok((Object) errorResponse));
                        }
                        
                        Long korisnikId = (long) korisnik.getIdKorisnika();
                        System.out.println("Found korisnik with ID: " + korisnikId);
                        
                        // Get all transactions for this user
                        return transakcijaService.getTransakcijeByUserId(korisnikId)
                                .collectList()
                                .map(transakcije -> {
                                    System.out.println("Found " + transakcije.size() + " transactions for user");
                                    Map<String, Object> response = new HashMap<>();
                                    response.put("transactions", transakcije);
                                    if (transakcije.isEmpty()) {
                                        response.put("message", "Nema dostupnih transakcija");
                                    } else {
                                        response.put("total", transakcije.size());
                                    }
                                    return ResponseEntity.ok((Object) response);
                                });
                    })
                    .onErrorResume(error -> {
                        System.err.println("Error fetching transaction history: " + error.getMessage());
                        error.printStackTrace();
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("error", "Greška pri dohvaćanju istorije transakcija: " + error.getMessage());
                        errorResponse.put("message", "Nema dostupnih transakcija");
                        errorResponse.put("transactions", new java.util.ArrayList<>());
                        return Mono.just(ResponseEntity.ok((Object) errorResponse));
                    });
            
        } catch (Exception e) {
            System.err.println("Error fetching current user transaction history: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Greška pri dohvaćanju istorije transakcija: " + e.getMessage());
            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body((Object) errorResponse));
        }
    }
}
