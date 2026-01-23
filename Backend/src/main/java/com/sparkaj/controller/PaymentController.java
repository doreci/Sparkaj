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
import java.text.SimpleDateFormat;

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

                        return Mono.just(ResponseEntity.ok(response));
                    } catch (Exception e) {
                        System.err.println("[PaymentController] Greška: " + e.getMessage());
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("error", e.getMessage());
                        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse));
                    }
                }
            }

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

                            long amount = (long) (oglas.getCijena() * 100); // U centima

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
            if (request == null) {
                System.err.println("Request is null!");
                return Mono.just(new ResponseEntity<>((Object) "Request body is null", HttpStatus.BAD_REQUEST));
            }
            
            // System.out.println("Payment Intent ID: " + request.getPaymentIntentId());
            // System.out.println("Oglas ID: " + request.getOglasId());
            // System.out.println("Korisnik ID: " + request.getKorisnikId());
            // System.out.println("Iznos: " + request.getIznos());
            // System.out.println("Selected Slots: " + request.getSelectedSlots());
            // System.out.println("Cijena: " + request.getCijena());
            
            if (request.getPaymentIntentId() == null || request.getIznos() == null) {
                return Mono.just(new ResponseEntity<>((Object) "Missing paymentIntentId or iznos", HttpStatus.BAD_REQUEST));
            }

            if (request.getKorisnikId() == null || request.getOglasId() == null) {
                return Mono.just(new ResponseEntity<>((Object) "Missing korisnikId or oglasId", HttpStatus.BAD_REQUEST));
            }


            if (request.getSelectedSlots() != null && !request.getSelectedSlots().isEmpty()) {
                
                return createBatchReservationsAndTransaction(
                    request.getKorisnikId(),
                    request.getOglasId().longValue(),
                    request.getSelectedSlots(),
                    request.getPaymentIntentId(),
                    request.getIznos()
                );
            } else {
                
                return rezervacijaService.createRezervacija(request.getKorisnikId(), request.getOglasId().longValue())
                        .flatMap(rezervacija -> {
                            if (rezervacija == null) {
                                System.err.println("Failed to create reservation");
                                return Mono.just(new ResponseEntity<>((Object) "Failed to create reservation", HttpStatus.INTERNAL_SERVER_ERROR));
                            }

                            Long reservationId = rezervacija.getIdRezervacije();

                            return transakcijaService.saveTransakcija(
                                    request.getPaymentIntentId(),
                                    reservationId,
                                    request.getIznos()
                            ).flatMap(transakcija -> {
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
            }

        } catch (Exception e) {
            System.err.println("Exception in confirmPayment: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error: " + e.getMessage());
            return Mono.just(new ResponseEntity<>((Object) errorResponse, HttpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    private Mono<ResponseEntity<Object>> createBatchReservationsAndTransaction(
            Long korisnikId, Long oglasId, java.util.List<String> selectedSlots,
            String paymentIntentId, Double iznos) {
        
        try {
            // if (selectedSlots != null && !selectedSlots.isEmpty()) {
            //     System.out.println("First slot: " + selectedSlots.get(0));
            //     System.out.println("Last slot: " + selectedSlots.get(selectedSlots.size() - 1));
            // }
            
            if (selectedSlots == null || selectedSlots.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "No selected slots provided");
                return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body((Object) errorResponse));
            }
            
            java.util.List<java.util.List<java.util.Map<String, Object>>> groupedSlots = groupSlots(selectedSlots);
            
            if (groupedSlots.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Failed to parse time slots");
                return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body((Object) errorResponse));
            }
            
            java.util.List<java.util.Map<String, Object>> slotsForBackend = new java.util.ArrayList<>();

            for (java.util.List<java.util.Map<String, Object>> group : groupedSlots) {
                if (!group.isEmpty()) {
                    java.util.Map<String, Object> firstSlot = group.get(0);
                    java.util.Map<String, Object> lastSlot = group.get(group.size() - 1);

                    java.time.LocalDateTime datumOd = (java.time.LocalDateTime) firstSlot.get("dateTime");
                    java.time.LocalDateTime datumDo = (java.time.LocalDateTime) lastSlot.get("dateTime");
                    datumDo = datumDo.plusHours(1);

                    java.util.Map<String, Object> slotData = new java.util.HashMap<>();
                    slotData.put("datumOd", datumOd.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
                    slotData.put("datumDo", datumDo.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
                    slotsForBackend.add(slotData);
                    
                    System.out.println("Group: " + slotData.get("datumOd") + " -> " + slotData.get("datumDo"));
                }
            }


            // Kreiraj sve rezervacije
            java.util.List<reactor.core.publisher.Mono<com.sparkaj.model.Rezervacija>> reservationMonos = new java.util.ArrayList<>();
            
            for (java.util.Map<String, Object> slot : slotsForBackend) {
                java.time.LocalDateTime datumOd = java.time.LocalDateTime.parse(
                    (String) slot.get("datumOd"),
                    java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
                );
                java.time.LocalDateTime datumDo = java.time.LocalDateTime.parse(
                    (String) slot.get("datumDo"),
                    java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
                );
                
                reservationMonos.add(
                    rezervacijaService.createRezervacijaWithDetails(korisnikId, oglasId, datumOd, datumDo)
                );
            }

            // Kombiniraj sve rezervacije
            return reactor.core.publisher.Flux.fromIterable(reservationMonos)
                    .flatMap(mono -> mono)
                    .collectList()
                    .flatMap(results -> {
                        if (results.isEmpty()) {
                            Map<String, Object> response = new HashMap<>();
                            response.put("error", "Greška pri kreiranju rezervacija");
                            return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body((Object) response));
                        }

                        Long firstReservationId = results.get(0).getIdRezervacije();

                        return transakcijaService.saveTransakcija(paymentIntentId, firstReservationId, iznos)
                                .flatMap(transakcija -> {
                                    Map<String, Object> response = new HashMap<>();
                                    response.put("success", true);
                                    response.put("transactionId", transakcija.getIdTransakcija());
                                    response.put("reservationCount", results.size());
                                    response.put("message", "Payment confirmed and batch reservations created");
                                    return Mono.just(ResponseEntity.ok((Object) response));
                                });
                    })
                    .onErrorResume(error -> {
                        System.err.println("Error in batch reservation: " + error.getMessage());
                        error.printStackTrace();
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("error", "Batch reservation failed: " + error.getMessage());
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body((Object) errorResponse));
                    });
        } catch (Exception e) {
            System.err.println("Exception in createBatchReservationsAndTransaction: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error processing batch reservations: " + e.getMessage());
            return Mono.just(new ResponseEntity<>((Object) errorResponse, HttpStatus.INTERNAL_SERVER_ERROR));
        }
    }

    private java.util.List<java.util.List<java.util.Map<String, Object>>> groupSlots(java.util.List<String> selectedSlots) {
        java.util.List<java.util.Map<String, Object>> parsedSlots = new java.util.ArrayList<>();
        
        for (String slot : selectedSlots) {
            try {
                int lastDashIndex = slot.lastIndexOf("-");
                if (lastDashIndex > 0) {
                    String dateStr = slot.substring(0, lastDashIndex); 
                    String hourStr = slot.substring(lastDashIndex + 1); 
                    
                    java.text.SimpleDateFormat formatter = new java.text.SimpleDateFormat("EEE MMM dd yyyy", java.util.Locale.ENGLISH);
                    java.util.Date parsedDate = formatter.parse(dateStr);
                    java.time.LocalDate date = parsedDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
                    int hour = Integer.parseInt(hourStr);
                    java.time.LocalDateTime dateTime = java.time.LocalDateTime.of(date, java.time.LocalTime.of(hour, 0, 0));
                    
                    java.util.Map<String, Object> slotData = new java.util.HashMap<>();
                    slotData.put("date", date);
                    slotData.put("hour", hour);
                    slotData.put("dateTime", dateTime);
                    parsedSlots.add(slotData);
                    
                }
            } catch (Exception e) {
                System.err.println("Error parsing slot: " + slot + " - " + e.getMessage());
                e.printStackTrace();
            }
        }

        // Sortiraj po datumu i satu
        parsedSlots.sort((a, b) -> {
            java.time.LocalDateTime timeA = (java.time.LocalDateTime) a.get("dateTime");
            java.time.LocalDateTime timeB = (java.time.LocalDateTime) b.get("dateTime");
            return timeA.compareTo(timeB);
        });

        java.util.List<java.util.List<java.util.Map<String, Object>>> groups = new java.util.ArrayList<>();
        java.util.List<java.util.Map<String, Object>> currentGroup = new java.util.ArrayList<>();

        for (int i = 0; i < parsedSlots.size(); i++) {
            java.util.Map<String, Object> currentSlot = parsedSlots.get(i);
            
            if (currentGroup.isEmpty()) {
                currentGroup.add(currentSlot);
            } else {
                java.util.Map<String, Object> lastSlot = currentGroup.get(currentGroup.size() - 1);
                java.time.LocalDateTime lastTime = (java.time.LocalDateTime) lastSlot.get("dateTime");
                java.time.LocalDateTime currentTime = (java.time.LocalDateTime) currentSlot.get("dateTime");

                if (currentTime.equals(lastTime.plusHours(1))) {
                    currentGroup.add(currentSlot);
                } else {
                    groups.add(new java.util.ArrayList<>(currentGroup));
                    currentGroup = new java.util.ArrayList<>();
                    currentGroup.add(currentSlot);
                }
            }

            if (i == parsedSlots.size() - 1) {
                groups.add(currentGroup);
            }
        }

        return groups;
    }

    @GetMapping("/transaction-history/{userId}")
    public Mono<ResponseEntity<Object>> getTransactionHistory(@PathVariable Long userId) {
        
        return transakcijaService.getTransakcijeByUserId(userId)
                .collectList()
                .map(transakcije -> {
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
        
        if (authentication == null || !authentication.isAuthenticated()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Korisnik nije autentificiran");
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body((Object) errorResponse));
        }

        try {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            String email = oauth2User.getAttribute("email");
            String googleId = oauth2User.getAttribute("sub");
            
            return korisnikService.getKorisnikByEmail(email)
                    .flatMap(korisnik -> {
                        if (korisnik == null) {
                            Map<String, Object> errorResponse = new HashMap<>();
                            errorResponse.put("error", "Korisnik nije pronađen u bazi podataka");
                            errorResponse.put("message", "Nema dostupnih transakcija");
                            errorResponse.put("transactions", new java.util.ArrayList<>());
                            return Mono.just(ResponseEntity.ok((Object) errorResponse));
                        }
                        
                        Long korisnikId = (long) korisnik.getIdKorisnika();
                        
                        return transakcijaService.getTransakcijeByUserId(korisnikId)
                                .collectList()
                                .map(transakcije -> {
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
