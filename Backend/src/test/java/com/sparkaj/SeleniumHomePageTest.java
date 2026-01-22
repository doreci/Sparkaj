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

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

class SeleniumHomePageTest {

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
     * Provjera da se Home stranica učitava
     */
    @Test
    void homePageLoadsSuccessfully() {
        driver.get(BASE_URL);

        WebElement body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );

        assertTrue(body.isDisplayed(), "Body element mora postojati");
    }

    /**
     * Provjera da su header, logo i footer vidljivi
     */
    @Test
    void headerLogoAndFooterAreVisible() {
        driver.get(BASE_URL);

        WebElement logo = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.name("logo"))
        );
        assertTrue(logo.isDisplayed(), "Logo mora biti vidljiv");

        WebElement footer = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.className("footer"))
        );
        assertTrue(
                footer.getText().contains("Sparkaj"),
                "Footer mora sadržavati naziv aplikacije"
        );
    }

    /**
     * Provjera da se Login gumb prikazuje
     * kada korisnik nije prijavljen
     */
    @Test
    void loginButtonIsVisibleForUnauthenticatedUser() {
        driver.get(BASE_URL);

        WebElement loginButton = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//button[text()='Login']")
                )
        );

        assertTrue(loginButton.isDisplayed(), "Login gumb mora biti vidljiv");
    }

    /**
     * Provjera da postoji sekcija s oglasima
     */
    @Test
    void adsSectionTitleIsDisplayed() {
        driver.get(BASE_URL);

        WebElement sectionTitle = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.className("section-title")
                )
        );

        String titleText = sectionTitle.getText().toLowerCase();
        assertTrue(
                titleText.contains("popularni oglasi") ||
                titleText.contains("rezultati pretrage"),
                "Naslov sekcije oglasa mora biti ispravan"
        );
    }

    /**
     * Provjera da klik na Login vodi na /login rutu
     */
    @Test
    void clickingLoginButtonRedirectsToLoginPage() {
        driver.get(BASE_URL);

        WebElement loginButton = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//button[text()='Login']")
                )
        );

        loginButton.click();

        wait.until(ExpectedConditions.urlContains("/login"));
        assertTrue(
                driver.getCurrentUrl().contains("/login"),
                "Klik na Login mora preusmjeriti na /login"
        );
    }
}