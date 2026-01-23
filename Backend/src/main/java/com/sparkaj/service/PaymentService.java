package com.sparkaj.service;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    public PaymentService() {
        Stripe.apiKey = "sk_test_51SebNeCxvTBjwGGPhKUXVLx6dq9Z35bHmKr3YYe6iZi6NxFvqrPv1FW9nWkUnKNUHYQpQjE8bIEpEfBmNjPLnL4200IBbYo7BM";
    }

    public Map<String, Object> createPaymentIntent(Long amount) {
        try {
            // System.out.println("[PaymentService] Kreiram payment intent za iznos: " + amount + " centima");

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amount)
                    .setCurrency("eur")
                    .setPaymentMethod(null)
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);


            Map<String, Object> response = new HashMap<>();
            response.put("clientSecret", paymentIntent.getClientSecret());
            response.put("paymentIntentId", paymentIntent.getId());
            return response;
        } catch (Exception e) {
            System.err.println("[PaymentService] ✗ Greška pri kreiranju payment intenta: " + e.getMessage());
            throw new RuntimeException("Greška pri kreiranju payment intenta: " + e.getMessage());
        }
    }

    public Map<String, Object> confirmPayment(String paymentIntentId) {
        try {

            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

            Map<String, Object> response = new HashMap<>();
            response.put("id", paymentIntent.getId());
            response.put("status", paymentIntent.getStatus());
            response.put("amount", paymentIntent.getAmount() / 100.0);
            return response;
        } catch (Exception e) {
            System.err.println("[PaymentService] ✗ Greška pri potvrdi plaćanja: " + e.getMessage());
            throw new RuntimeException("Greška pri potvrdi plaćanja: " + e.getMessage());
        }
    }
}
