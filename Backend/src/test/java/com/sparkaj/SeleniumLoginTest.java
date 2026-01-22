package com.sparkaj;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

class SeleniumLoginTest {

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
     * Provjera da se login stranica učitava
     */
    @Test
    void loginPageLoadsSuccessfully() {
        driver.get(BASE_URL + "/login");

        WebElement body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );

        assertTrue(body.isDisplayed());
    }

    /**
     * Provjera da postoji Google login gumb
     */
    @Test
    void googleLoginButtonExists() {
        driver.get(BASE_URL + "/login");

        WebElement googleButton = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//*[contains(text(),'Google')]")
                )
        );

        assertTrue(googleButton.isDisplayed());
    }

    /**
     * Provjera da postoji gumb za prijavu
     */
    @Test
    void loginButtonExists() {
        driver.get(BASE_URL + "/login");

        WebElement loginButton = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//button[contains(text(),'Login') or contains(text(),'Prijavi')]")
                )
        );

        assertTrue(loginButton.isDisplayed());
    }

    /**
     * Provjera da klik na login gumb NE RUŠI aplikaciju
     * (OAuth redirect se ne testira)
     */
    @Test
    void loginButtonIsClickable() {
        driver.get(BASE_URL + "/login");

        WebElement loginButton = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//button[contains(text(),'Login') or contains(text(),'Prijavi')]")
                )
        );

        assertDoesNotThrow(loginButton::click);
    }
}
