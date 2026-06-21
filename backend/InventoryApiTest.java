import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Integration test for the Inventory API.
 * Tests login and deleting an inventory item.
 */
public class InventoryApiTest {
    // Execute tests for login and inventory deletion endpoints
    public static void main(String[] args) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            
            // 1. Login
            String loginJson = "{\"email\":\"admin@example.com\",\"password\":\"password\"}";
            HttpRequest loginReq = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8085/api/auth/login"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(loginJson))
                    .build();
            
            HttpResponse<String> loginResponse = client.send(loginReq, HttpResponse.BodyHandlers.ofString());
            
            if (loginResponse.statusCode() >= 400) {
                System.out.println("Login Error: " + loginResponse.statusCode());
                System.out.println(loginResponse.body());
                return;
            }
            
            // Extract token - simplified parsing without external libraries like Jackson/Gson
            String body = loginResponse.body();
            String token = "";
            String tokenKey = "\"token\":\"";
            int startIndex = body.indexOf(tokenKey);
            if (startIndex != -1) {
                startIndex += tokenKey.length();
                int endIndex = body.indexOf("\"", startIndex);
                if (endIndex != -1) {
                    token = body.substring(startIndex, endIndex);
                }
            }
            
            if (token.isEmpty()) {
                System.out.println("Could not parse token from response: " + body);
                return;
            }

            // 2. Delete inventory item
            HttpRequest delReq = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:8085/api/inventory/1"))
                    .header("Authorization", "Bearer " + token)
                    .DELETE()
                    .build();
                    
            HttpResponse<String> delResponse = client.send(delReq, HttpResponse.BodyHandlers.ofString());
            
            if (delResponse.statusCode() >= 400) {
                System.out.println("Delete Error: " + delResponse.statusCode());
                System.out.println(delResponse.body());
            } else {
                System.out.println("Delete OK");
            }

        } catch (Exception e) {
            System.out.println("Exception: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
