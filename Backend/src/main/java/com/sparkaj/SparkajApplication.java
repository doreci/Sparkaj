package com.sparkaj;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SparkajApplication {
    public static void main(String[] args) {
        SpringApplication.run(SparkajApplication.class, args);
        System.out.println("\nAplikacija pokrenuta!");
    }
}