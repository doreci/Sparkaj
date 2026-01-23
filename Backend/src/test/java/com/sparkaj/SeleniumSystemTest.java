package com.sparkaj;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.AfterAll;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.Keys;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.Alert;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SeleniumSystemTest {

    private static WebDriver driver;
    private WebDriverWait wait;
    private static final String BASE_URL = "http://localhost:10000";

    @BeforeEach
    void setup() {
        if (driver == null) {
            WebDriverManager.chromedriver().setup();
            var options = new ChromeOptions();
            // Opcije da bi se izbjegla Google sigurnosna ograničenja
            options.addArguments("--disable-web-security");
            options.addArguments("--no-sandbox");
            options.addArguments("--disable-dev-shm-usage");
            options.addArguments("--disable-extensions");
            options.addArguments("--disable-gpu");
            options.addArguments("--disable-blink-features=AutomationControlled");
            options.addArguments("--disable-popup-blocking");
            options.addArguments("--disable-default-apps");
            options.addArguments("--enable-automation=false");
            options.setExperimentalOption("useAutomationExtension", false);
            driver = new ChromeDriver(options);
            driver.manage().window().maximize();
            
            driver.get(BASE_URL);
            
            // Čekaj da se stranica učita
            try {
                Thread.sleep(3000); // Čekaj 3 sekundi da se stranica učita
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        wait = new WebDriverWait(driver, Duration.ofSeconds(5));
    }

    @AfterEach
    void teardown() {
        // Ostavi sesiju upaljenu
    }

    @AfterAll
    static void cleanup() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @Order(1)
    void testAuthentication() {
        driver.get(BASE_URL);
        
        WebElement body = wait.until(
            ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed());
        
        WebElement loginButton = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                By.xpath("//button[contains(text(), 'Login')]")
            )
        );
        assertTrue(loginButton.isDisplayed());

        loginButton.click();

        WebElement loginButton2 = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                By.xpath("//button[contains(text(), 'Prijavi se')]")
            )
        );
        assertTrue(loginButton2.isDisplayed());
        loginButton2.click();

        WebElement googleOAuth = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                By.xpath("//a[contains(@href, 'accounts.google.com')]")
            )
        );

        assertTrue(googleOAuth.isDisplayed());

        try {
            Thread.sleep(30000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        WebElement logoutButton = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                By.xpath("//button[contains(text(), 'Logout')]")
            )
        );
        assertTrue(logoutButton.isDisplayed());
    }
    
    @Test
    @Order(6)
    void testResponsiveDesign() {
        driver.get(BASE_URL);

        List<Dimension> dimensions = List.of(
            new Dimension(1920, 1080),
            new Dimension(768, 1024),
            new Dimension(360, 800)  
        );

        for (Dimension dimension : dimensions) {
            driver.manage().window().setSize(dimension);
            WebElement body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
            );
            assertTrue(body.isDisplayed(), "Stranica se trebala učitati na dimenzijama: " + dimension);
        }
    }

    @Test
    @Order(3)
    void testEmptyAdForm() {
        driver.get(BASE_URL + "/napravi-oglas");

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        WebElement submitButton = driver.findElement(By.xpath("//button[contains(text(), 'Spremi oglas')]"));
        submitButton.click();

        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        // Provjeri je li prikazan alert
        try {
            Alert alert = wait.until(ExpectedConditions.alertIsPresent());
            String alertText = alert.getText();
            assertTrue(alertText.contains("ne smije biti prazan") || alertText.contains("mora biti"), "Alert trebao bi obavijestiti korisnika");
            alert.accept(); // Zatvori alert
            System.out.println("✓ Alert za praznu formu: " + alertText);
        } catch (TimeoutException e) {
            // Ako nema alerta, forma bi trebala ostati vidljiva
            WebElement form = driver.findElement(By.xpath("//form"));
            assertTrue(form.isDisplayed(), "Forma trebala bi biti vidljiva");
            System.out.println("✓ Prazna forma je odbijena");
        }
    }

    @Test
    @Order(4)
    void testInvalidPrice() {
        driver.get(BASE_URL + "/napravi-oglas");

        WebElement nazivInput = wait.until(
            ExpectedConditions.presenceOfElementLocated(By.id("naziv_oglasa"))
        );
        nazivInput.sendKeys("Test parking");
        
        WebElement opisInput = driver.findElement(By.id("opis_oglasa"));
        opisInput.sendKeys("Test opis");
        
        WebElement cijenInput = driver.findElement(By.id("cijena"));
        cijenInput.sendKeys("-50");
        
        WebElement lokacijaInput = driver.findElement(By.id("lokacija"));
        lokacijaInput.sendKeys("Ulica Test 1, 10000, Zagreb");

        WebElement submitButton = driver.findElement(By.xpath("//button[contains(text(), 'Spremi oglas')]"));
        submitButton.click();

        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        // Provjeri je li prikazan alert o negativnoj cijeni
        try {
            Alert alert = wait.until(ExpectedConditions.alertIsPresent());
            String alertText = alert.getText();
            assertTrue(alertText.contains("negativna"), "Alert trebao bi obavijestiti korisnika o negativnoj cijeni");
            alert.accept(); // Zatvori alert
            System.out.println("✓ Alert za negativnu cijenu: " + alertText);
        } catch (TimeoutException e) {
            fail("Sustav nije prikazao alert za negativnu cijenu");
        }
    }

    @Test
    @Order(5)
    void testNonexistentPage() {
        driver.get(BASE_URL + "/nepostojeca-stranica-xyz");

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        WebElement body = driver.findElement(By.tagName("body"));
        assertTrue(body.isDisplayed());

        WebElement errorCode = wait.until(
            ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".error-code"))
        );
        assertEquals("404", errorCode.getText());

        WebElement errorTitle = driver.findElement(
            By.cssSelector(".error-title")
        );
        assertTrue(errorTitle.getText().contains("nije pronađena"));
    }

    @Test
    @Order(2)
    void testCreateAd() {
        driver.get(BASE_URL + "/napravi-oglas");

        WebElement body = wait.until(
            ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed());


        WebElement nazivInput = wait.until(
            ExpectedConditions.presenceOfElementLocated(By.id("naziv_oglasa"))
        );
        
        nazivInput.sendKeys("Parking u centru");
        
        WebElement opisInput = driver.findElement(By.id("opis_oglasa"));
        opisInput.sendKeys("Prostrani parking sa GPS sustavom");
        
        WebElement cijenInput = driver.findElement(By.id("cijena"));
        cijenInput.sendKeys("50");
        
        WebElement lokacijaInput = driver.findElement(By.id("lokacija"));
        lokacijaInput.sendKeys("Ulica Glavna 123, 10000, Zagreb");

        WebElement submitButton = driver.findElement(By.xpath("//button[contains(text(), 'Spremi oglas')]"));
        submitButton.click();

        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        driver.get(BASE_URL);

        WebElement profile = driver.findElement(By.xpath("//a[contains(@href, '/profil')]"));
        profile.click();

        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        WebElement mojOglas = driver.findElement(By.xpath("//div[contains(@class,'ad-card')]//h3[contains(., 'Parking u centru')]"));
        assertTrue(mojOglas.isDisplayed());
    }

    
}
