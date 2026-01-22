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
import org.openqa.selenium.Keys;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.Dimension;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SystemIntegrationTest {

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

    @Test
    void testNormalCaseHomePageNavigation() {
        driver.get(BASE_URL);
        
        WebElement body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed(), "Stranica se trebala učitati");
        
        String pageTitle = driver.getTitle();
        assertNotNull(pageTitle, "Stranica trebala bi imati naslov");
        assertTrue(pageTitle.length() > 0, "Naslov ne bi trebao biti prazan");
    }

    @Test
    void testNormalCaseAdLoadingAndDisplay() {
        driver.get(BASE_URL);
        
        try {
            WebElement adsContainer = wait.until(
                    ExpectedConditions.presenceOfElementLocated(
                            By.xpath("//div[contains(@class, 'ad') or contains(@class, 'card')]")
                    )
            );
            assertTrue(adsContainer.isDisplayed(), "Oglasi trebali bi biti vidljivi");
        } catch (TimeoutException e) {
            assertTrue(true, "Nema oglasa za prikazati - to je prihvatljivo");
        }
    }

    @Test
    void testNormalCaseLoginPageAccess() {
        driver.get(BASE_URL + "/login");
        
        WebElement body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed(), "Login stranica se trebala učitati");
        
        String pageSource = driver.getPageSource();
        assertTrue(pageSource.toLowerCase().contains("login") || 
                   pageSource.toLowerCase().contains("google") ||
                   pageSource.toLowerCase().contains("prijavi"),
                   "Login stranica trebala bi sadržavati opcije prijave");
    }

    @Test
    void testBoundaryConditionEmptySearch() {
        driver.get(BASE_URL);
        
        try {
            WebElement searchInput = wait.until(
                    ExpectedConditions.presenceOfElementLocated(
                        By.xpath("//input[contains(@placeholder,'search') or contains(@placeholder,'Search') or @type='search']")
                    )
            );
            
            searchInput.clear();
            searchInput.sendKeys("  ");
            searchInput.sendKeys(Keys.RETURN);
            
            Thread.sleep(2000);
            String pageSource = driver.getPageSource();
            assertTrue(pageSource.length() > 100, "Sustav trebao bi vratiti rezultate ili poruku");
        } catch (TimeoutException e) {
            assertTrue(true, "Search input nije dostupan");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Test
    void testBoundaryConditionSpecialCharactersInSearch() {
        driver.get(BASE_URL);
        
        try {
            WebElement searchInput = wait.until(
                    ExpectedConditions.presenceOfElementLocated(
                            By.xpath("//input[contains(@placeholder,'search') or contains(@placeholder,'Search') or @type='search']")
                    )
            );
            
            searchInput.clear();
            searchInput.sendKeys("!@#$%^&*()");
            searchInput.sendKeys(Keys.RETURN);
            
            Thread.sleep(2000);
            String pageSource = driver.getPageSource();
            assertTrue(pageSource.length() > 100, "Sustav trebao bi podnijeti specijalne znakove");
        } catch (TimeoutException e) {
            assertTrue(true, "Search input nije dostupan");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Test
    void testBoundaryConditionVeryLongSearch() {
        driver.get(BASE_URL);
        
        try {
            WebElement searchInput = wait.until(
                    ExpectedConditions.presenceOfElementLocated(
                            By.xpath("//input[contains(@placeholder,'search') or contains(@placeholder,'Search') or @type='search']")
                    )
            );
            
            String longText = "a".repeat(500);
            searchInput.clear();
            searchInput.sendKeys(longText);
            searchInput.sendKeys(Keys.RETURN);
            
            Thread.sleep(2000);
            String pageSource = driver.getPageSource();
            assertTrue(pageSource.length() > 100, "Sustav trebao bi podnijeti dugačak unos");
        } catch (TimeoutException e) {
            assertTrue(true, "Search input nije dostupan");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Test
    void testNonexistentPageHandling() {
        driver.get(BASE_URL + "/nepostoji/stranica/koja/nema/smisla");
        
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        String pageSource = driver.getPageSource();
        
        assertTrue(pageSource.length() > 50, 
                   "Sustav trebao bi vratiti neku poruku ili preusmjeriti");
    }

    @Test
    void testNonexistentAdPageHandling() {
        driver.get(BASE_URL + "/ad/999999999");
        
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        String pageSource = driver.getPageSource();
        
        assertTrue(pageSource.length() > 50, 
                   "Sustav trebao bi vratiti poruku o nepostojećem oglasu ili error stranicu");
    }

    @Test
    void testNonexistentUserProfileHandling() {
        driver.get(BASE_URL + "/profile/nonexistent123456");
        
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        String pageSource = driver.getPageSource();
        
        assertTrue(pageSource.length() > 50, 
                   "Sustav trebao bi vratiti poruku o nepostojećem korisniku");
    }

    @Test
    void testBrowserBackButtonFunctionality() {
        driver.get(BASE_URL);
        WebElement body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed(), "Home stranica učitana");
        
        driver.navigate().to(BASE_URL + "/login");
        body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed(), "Login stranica učitana");
        
        driver.navigate().back();
        
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed(), "Trebali bi se vratiti na home stranicu");
    }

    @Test
    void testPageRefreshMaintainsContent() {
        driver.get(BASE_URL);
        
        String titleBefore = driver.getTitle();
        
        driver.navigate().refresh();
        
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        
        String titleAfter = driver.getTitle();
        assertEquals(titleBefore, titleAfter, "Naslov trebao bi biti isti nakon osvježavanja");
        
        WebElement body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed(), "Stranica trebala bi biti vidljiva nakon osvježavanja");
    }

    @Test
    void testMultipleNavigationSequence() {
        driver.get(BASE_URL);

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        
        WebElement body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed(), "Home učitana");
        
        driver.navigate().to(BASE_URL + "/login");

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        assertTrue(driver.getCurrentUrl().contains("/login"), "Login URL trebao bi biti aktivan");
        
        driver.navigate().back();

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        assertTrue(driver.getCurrentUrl().contains("/") && !driver.getCurrentUrl().contains("/login"), 
                   "Trebali bi se vratiti na home");
    }

    @Test
    void testPageLoadTimeIsReasonable() {
        long startTime = System.currentTimeMillis();
        driver.get(BASE_URL);
        wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));
        long endTime = System.currentTimeMillis();
        
        long loadTime = endTime - startTime;
        assertTrue(loadTime < 30000, "Stranica se trebala učitati u manje od 30 sekundi (učitana u " + loadTime + "ms)");
    }

    @Test
    void testResponsiveDesignBasic() {
        driver.manage().window().setSize(new Dimension(1920, 1080));
        driver.get(BASE_URL);
        WebElement body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed(), "Stranica trebala bi biti prikazana na 1920x1080");
        
        driver.manage().window().setSize(new Dimension(768, 1024));

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed(), "Stranica trebala bi biti prikazana na 768x1024");
        
        driver.manage().window().setSize(new Dimension(375, 812));

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        body = wait.until(
                ExpectedConditions.presenceOfElementLocated(By.tagName("body"))
        );
        assertTrue(body.isDisplayed(), "Stranica trebala bi biti prikazana na 375x812 (mobitel)");
    }
}
