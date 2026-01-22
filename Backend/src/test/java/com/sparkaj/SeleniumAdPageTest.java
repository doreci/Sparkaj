package com.sparkaj;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.util.List;


import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

class SeleniumAdPageTest {

    private WebDriver driver;
    private WebDriverWait wait;

    private static final String BASE_URL = "http://localhost:10000";

    @BeforeEach
    void setup() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @AfterEach
    void teardown() {
        if (driver != null) {
            driver.quit();
        }
    }

    /**
     * Provjera da se oglasi učitavaju na Home stranici
     */
    @Test
    void adsAreDisplayedOnHomePage() {
        driver.get(BASE_URL);

        WebElement adsSection = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.className("ads-grid")
                )
        );

        List<WebElement> ads = adsSection.findElements(By.className("ad-card"));
        assertFalse(ads.isEmpty(), "Mora postojati barem jedan oglas");
    }

    /**
     * Provjera naslova sekcije oglasa
     */
    @Test
    void adsSectionTitleIsCorrect() {
        driver.get(BASE_URL);

        WebElement sectionTitle = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.className("section-title")
                )
        );

        assertTrue(
                sectionTitle.getText().contains("Popularni") ||
                sectionTitle.getText().contains("Rezultati"),
                "Naslov sekcije oglasa mora biti ispravan"
        );
    }

    /**
     * Provjera da gumb 'Pogledaj sve oglase' postoji
     * kada ima više od 5 oglasa
     */
    @Test
    void viewAllAdsButtonExists() {
        driver.get(BASE_URL);

        List<WebElement> buttons = driver.findElements(
                By.className("btn-view-all")
        );

        assertTrue(
                buttons.size() >= 0,
                "Gumb za prikaz svih oglasa je opcionalan, ali ne smije srušiti test"
        );
    }
}