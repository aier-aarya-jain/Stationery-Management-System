# 📚 Stationery Management System

Welcome to the **Stationery Management System**! This project is a full-stack web application designed to help schools or universities manage their stationery supplies (like pens, paper, and notebooks). 

In simple terms:
- **Students** can log in, browse available stationery items, and submit a request for what they need.
- **Administrators** can log in, add new stationery to the inventory, and approve or reject student requests. When an admin approves a request, the system automatically deducts the requested items from the inventory.

---

## 🏗️ How It Works (The Architecture)

Instead of building one giant application, this project uses a **Microservices Architecture**. This means the backend is split into small, focused "mini-servers" that talk to each other:

1. **Frontend (React + Vite)**: The user interface where students and admins click buttons and fill out forms.
2. **API Gateway**: The "front door". The frontend sends all traffic here, and the gateway routes it to the correct mini-server.
3. **Eureka Server**: The "phonebook". It keeps track of where all the mini-servers are running so they can find each other.
4. **Auth Service**: Handles user registration, passwords (encrypted with BCrypt), and creates secure "JWT Tokens" so users stay logged in.
5. **Inventory Service**: Manages the actual stock of stationery items.
6. **Request Service**: Handles students asking for items and admins approving them.

---

## ⚙️ What the Functions Do (Core Logic)

Here is a breakdown of the most important functions in the codebase and what they do in simple terms:

### 1. Authentication (`AuthServiceImpl.java`)
- `register()`: Takes a new user's email and password, checks if the email is already taken, scrambles the password for security, saves it to the database, and automatically logs them in.
- `login()`: Checks if the email and password match what is in the database. If they do, it hands the user a secure "JWT Token" which acts like a VIP wristband to access the rest of the app.

### 2. Inventory Management (`InventoryServiceImpl.java`)
- `addItem()`: Allows admins to create a brand new stationery item (like "Blue Pens") and set how many are available.
- `deductQuantity()`: A crucial background function. When an admin approves a request, this function safely subtracts the requested amount from the total stock, ensuring stock never drops below zero.

### 3. Request Management (`RequestServiceImpl.java`)
- `submitRequest()`: Saves a student's shopping cart of requested items to the database with a status of `PENDING`. *Note: Stock is NOT deducted yet!*
- `approveRequest()`: An admin clicks "Approve". This function calls the `Inventory Service` to actually deduct the stock. If successful, it changes the request status to `APPROVED`.
- `rejectRequest()`: Changes the request status to `REJECTED` and requires the admin to type a reason why. No stock is touched.

---

## 📖 Line-by-Line Explanation: How a Request is Approved

If an evaluator asks how your code actually works under the hood, here is a simple line-by-line breakdown of the most important function in the app: `approveRequest` inside `RequestServiceImpl.java`.

```java
// 1. We declare the function. It takes the ID of the request, the admin's email, and their security token.
public RequestResponseDto approveRequest(Long requestId, String adminEmail, String token) {
    
    // 2. We ask the database to find the request using the provided ID.
    StationeryRequest request = getRequestById(requestId);

    // 3. We check a strict rule: You can only approve a request if it is currently "PENDING".
    if (request.getStatus() != RequestStatus.PENDING) {
        throw new IllegalStateException("Only PENDING requests can be approved.");
    }

    // 4. We loop through every single item the student asked for in this request.
    for (RequestItem item : request.getItems()) {
        try {
            // 5. CRITICAL STEP: We send a network call to the separate 'Inventory Service' asking it to subtract the stock.
            inventoryClient.deductQuantity(token, item.getItemId(), item.getQuantity());
        } catch (Exception e) {
            // 6. If the Inventory Service says "Not enough stock!", we cancel the whole approval and show an error.
            throw new BusinessException("Insufficient stock for item.");
        }
    }

    // 7. If all stock was successfully deducted, we change the request's status to "APPROVED".
    request.setStatus(RequestStatus.APPROVED);
    
    // 8. We save this updated status back to the database.
    StationeryRequest saved = requestRepository.save(request);
    
    // 9. We write a permanent note in the Audit Log saying "This admin approved this request".
    logAction("APPROVE", adminEmail, "Approved request " + requestId);
    
    // 10. We return the updated data back to the frontend so the screen updates!
    return mapToDto(saved);
}
```

---

## 🔄 Alternative Approaches (And Why We Chose Ours)

Evaluators love to ask "How else could you have built this?". Here are the alternatives to the approaches used in this project:

### 1. Monolith vs. Microservices (Our Choice)
- **Alternative (Monolith)**: We could have put Auth, Inventory, and Requests all into one giant Spring Boot folder with one giant database. 
- **Why we chose Microservices**: Microservices allow different teams to work on different parts of the app without breaking things. If the Request Service crashes, the Inventory Service stays online!

### 2. Local Configuration vs. Config Server (Our Choice)
- **Alternative (Local Config)**: We could have stored database passwords in an `application.yml` file inside every single microservice.
- **Why we chose Config Server**: If our database password changes, we would have to manually edit 5 different files. By using Spring Cloud Config (`config-server`), all services fetch their settings from one central place on startup.

### 3. Database per Service vs. Shared Database
- **Alternative (Shared Database)**: All microservices connect to one single MySQL database (`stationery_db`).
- **Why we chose Database-per-Service**: In a true microservice architecture, services should not share databases. If they do, a change to a table by the Auth service might accidentally break the Inventory service. We used `stationery_auth`, `stationery_inventory`, and `stationery_request` to keep them isolated.

### 4. REST APIs vs. Message Queues (Kafka/RabbitMQ)
- **Alternative (Message Queues)**: When a request is approved, we could have published a message to a Kafka topic like `request-approved`, and the Inventory service would listen and deduct stock later in the background.
- **Why we chose REST (OpenFeign)**: Because deducting stock needs to happen *immediately* (to prevent two students from reserving the last pen at the exact same second), we used a synchronous HTTP call (OpenFeign). The system waits to make sure stock was deducted before telling the admin it was approved.

---

## 📂 Line-by-Line Explanation of Every Folder and File

If an evaluator asks you to explain the structure of your project, here is a simple line-by-line breakdown of what every file and folder is responsible for:

### 🌟 Root Directory (The Main Project Folder)
- **`backend/`**: The folder containing all of our Java Spring Boot microservices.
- **`frontend/`**: The folder containing our entire React UI application.
- **`mysql/`**: Contains `.sql` script files that automatically create our database tables when the project starts.
- **`docker-compose.yml`**: A critical file that tells Docker how to start all our microservices, databases, and frontend together with one command.
- **`documentation.md`**: A massive, highly detailed technical document containing deep architectural diagrams and code explanations.
- **`README.md`**: This file! A simple summary of the project.

### ⚙️ Backend Folders (The Microservices)
Inside the `backend/` folder, we have multiple standalone mini-servers:
- **`api-gateway/`**: The "Front Door". It receives requests from the frontend (like `/api/auth/login`) and forwards them to the correct microservice.
- **`auth-service/`**: Responsible for verifying passwords, creating new users, and generating JWT (Security) tokens.
- **`config-server/`**: A central hub that holds the settings (like database passwords) for all the other microservices so we don't have to duplicate them.
- **`config-repo/`**: A folder containing the actual `.yml` settings files that the `config-server` reads from.
- **`eureka-server/`**: The "Phonebook". When a microservice turns on, it tells Eureka "I am here!". This allows services to find each other.
- **`inventory-service/`**: Responsible for keeping track of how many pens, notebooks, and papers we have left in stock.
- **`request-service/`**: Responsible for managing the shopping cart of items students want, and handling the Admin's "Approve" or "Reject" clicks.
- **`pom.xml`**: The Maven build file. It tells Java which external libraries (like Spring Boot) to download for the backend.

### 🌐 Frontend Folders (The React Web App)
Inside the `frontend/` folder, we have the user interface:
- **`src/`**: The main folder where all our custom JavaScript/React code lives.
  - **`src/pages/`**: Contains the full screen views (e.g., `Login.jsx` for the login screen, `StudentDashboard.jsx` for the student view, `AdminDashboard.jsx` for the admin view).
  - **`src/components/`**: Contains smaller, reusable UI pieces (like a `Navbar.jsx` or a `Sidebar.jsx`) that are used across multiple pages.
  - **`src/api/`**: Contains `axiosInstance.js`, which is the tool the frontend uses to send HTTP network requests to the backend API Gateway.
  - **`src/App.jsx`**: The "Traffic Cop" of the frontend. It looks at the URL (like `/login` or `/admin`) and decides which page component to draw on the screen.
  - **`src/main.jsx`**: The absolute starting point of the React app. It takes `App.jsx` and injects it into the blank HTML page.
- **`public/`**: Contains static assets like images, icons, and the base `index.html` file that the browser actually loads.
- **`package.json`**: The NPM build file. It tells Node.js which external JavaScript libraries (like React, Axios, or TailwindCSS) to download for the frontend.
- **`vite.config.js`**: The configuration file for Vite, the ultra-fast tool we use to build and run our React code.

---

## 🔍 Deep Dive: Line-by-Line Code Explanations

Because this is a large microservices project with dozens of files, reading every file can be overwhelming. Below are line-by-line explanations of the absolute most critical files in the system to help evaluators understand the core logic.

### 1. `docker-compose.yml` (The System Starter)
This file is the glue that holds the entire project together. It tells Docker how to start all our databases and microservices.

```yaml
# Line 1: We define the "services" (containers) we want Docker to run.
services:

  # Line 3-10: We define our MySQL database container. We use the official mysql:8.0 image, set the root password to "root", and expose it on port 3306.
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3306:3306"

  # Line 12-20: We define the Config Server. It builds from the backend/config-server folder.
  config-server:
    build: ./backend/config-server
    ports:
      - "8888:8888"
    # Line 16: We map our local 'config-repo' folder into the container so the server can read the settings.
    volumes:
      - ./backend/config-repo:/config-repo

  # Line 22-26: The Eureka Server (Phonebook). It depends on the config-server being ready first.
  eureka-server:
    build: ./backend/eureka-server
    ports:
      - "8761:8761"
    depends_on:
      - config-server

  # Line 28-36: The Auth Service. It handles logins.
  auth-service:
    build: ./backend/auth-service
    ports:
      - "8081:8081"
    # Line 33: We tell the Auth Service to get its settings from the config-server we started above!
    environment:
      - SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8888/
    depends_on:
      - config-server
      - eureka-server
      - mysql
```

### 2. `AuthServiceImpl.java` (User Registration Logic)
This is where users are actually created in the backend.

```java
// Line 1: We declare the register function which takes in the student's typed details (RegisterRequest).
public AuthResponse register(RegisterRequest request) {
    
    // Line 2-3: We check the database (userRepository) to see if a user with this email already exists.
    if (userRepository.existsByEmail(request.getEmail())) {
        // Line 4: If they do exist, we throw an error saying "Email is already taken".
        throw new DuplicateResourceException("Email is already taken");
    }

    // Line 7: We create a blank, new User object.
    User user = new User();
    
    // Line 8-10: We fill the User object with the email, full name, and role (Student/Admin) they provided.
    user.setEmail(request.getEmail());
    user.setFullName(request.getFullName());
    user.setRole(request.getRole());

    // Line 12: CRITICAL STEP! We take their plain-text password, scramble it using "passwordEncoder" (BCrypt), and save the scrambled version.
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    
    // Line 13: We save the new user permanently into the MySQL database.
    userRepository.save(user);

    // Line 15-17: Now that they are registered, we automatically log them in by generating a secure JWT token for them.
    UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
    String token = jwtUtil.generateToken(userDetails);
    String refreshToken = jwtUtil.generateRefreshToken(userDetails);

    // Line 19-20: We write a note in the Audit Log that a new user registered, and we return the token to the frontend!
    logAction("REGISTER", user.getEmail(), "User registered with role " + user.getRole());
    return new AuthResponse(token, refreshToken, user.getEmail(), user.getFullName(), user.getRole());
}
```

### 3. `InventoryController.java` (Backend API for Stationery Stock)
This file handles the incoming web requests related to stationery items.

```java
// Line 1: @RestController tells Spring Boot this file listens for web requests.
@RestController
// Line 2: @RequestMapping means all URLs for this file start with "/api/inventory".
@RequestMapping("/api/inventory")
public class InventoryController {

    // Line 5: We bring in the InventoryService which has the actual business logic.
    private final InventoryService inventoryService;

    // Line 8: We create a constructor to automatically inject the service.
    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // Line 13: @GetMapping means this runs when someone visits "/api/inventory" to read data.
    @GetMapping
    // Line 14: @PreAuthorize enforces that only logged-in ADMINS or STUDENTS can view the inventory.
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_STUDENT')")
    public ResponseEntity<Page<StationeryItemDto>> getAllItems(
            // Line 16-18: We check the URL for page numbers and sorting instructions (like page=1&size=10).
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "name") String sortBy,
            Authentication auth) {
        
        // Line 22: We ask the service to go get the items from the database and return them inside a "200 OK" response.
        return ResponseEntity.ok(inventoryService.getAllItems(page, size, sortBy, auth != null ? auth.getName() : "Anonymous", auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))));
    }

    // Line 26: @PostMapping means this runs when the frontend sends new data to create an item.
    @PostMapping
    // Line 27: SECURITY: ONLY an ADMIN can add new items!
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<StationeryItemDto> addItem(@Valid @RequestBody StationeryItemDto dto, Authentication auth) {
        // Line 29: We pass the data to the service and return a "201 CREATED" success message.
        return new ResponseEntity<>(inventoryService.addItem(dto, auth.getName()), HttpStatus.CREATED);
    }
}
```

### 4. `InventoryServiceImpl.java` (Inventory Business Logic)
This file contains the actual code that talks to the MySQL database to manage stock.

```java
// Line 1: @Service tells Spring Boot this is a core business logic file.
@Service
public class InventoryServiceImpl implements InventoryService {

    // Line 4-5: We bring in the database repository and the audit log repository.
    private final StationeryItemRepository repository;
    private final InventoryAuditLogRepository auditLogRepository;

    // Line 10: The function to add a new item.
    @Override
    public StationeryItemDto addItem(StationeryItemDto dto, String adminEmail) {
        // Line 12: Check if a pen with this name already exists in the database.
        if (repository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalArgumentException("An item with this name already exists.");
        }
        
        // Line 16: Convert the raw data (DTO) into a Database Object (Entity).
        StationeryItem item = mapToEntity(dto);
        
        // Line 19: Save the new item into the MySQL database.
        StationeryItem saved = repository.save(item);
        
        // Line 21: Log the action so we know which Admin created it.
        logAction("ADD", adminEmail, "Added item: " + saved.getName());
        
        // Line 24: Return the saved item back to the controller.
        return mapToDto(saved);
    }

    // Line 28: The crucial function that deducts stock when a request is approved.
    @Override
    public void deductQuantity(Long id, Integer quantityToDeduct, String adminEmail) {
        // Line 30: Find the specific item in the database.
        StationeryItem item = repository.findById(id).orElseThrow();

        // Line 33: SECURITY CHECK - Make sure we don't drop below 0 stock!
        if (item.getAvailableQuantity() < quantityToDeduct) {
            throw new IllegalArgumentException("Insufficient stock for item: " + item.getName());
        }

        // Line 38: Subtract the requested amount from the total stock.
        item.setAvailableQuantity(item.getAvailableQuantity() - quantityToDeduct);
        
        // Line 41: Save the new, lower stock number back to the database.
        repository.save(item);
    }
}
```

### 5. `Login.jsx` (Frontend React Login Page)
This file draws the Login screen and sends the user's password to the backend.

```javascript
// Line 1-7: We import React and tools to navigate pages and decode security tokens.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { jwtDecode } from 'jwt-decode';

// Line 9: We start the Login React Component.
const Login = () => {
  // Line 10-11: We create memory "states" to hold whatever the user types in the email and password boxes.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Line 15: This runs when the user clicks the "Sign In" button.
  const handleLogin = async (e) => {
    // Line 16: Stops the page from refreshing.
    e.preventDefault();
    try {
      // Line 18: We send the typed email and password to our backend API!
      const response = await api.post('/auth/login', { email, password });
      
      // Line 19: If successful, the backend gives us a secure token.
      const { token, refreshToken } = response.data;
      
      // Line 20-21: We save this token in the browser's memory so they stay logged in.
      localStorage.setItem('token', token);
      
      // Line 23: We open the token to see if they are a Student or an Admin.
      const decoded = jwtDecode(token);
      
      // Line 26-30: If they are an Admin, send them to the Admin page. Otherwise, send them to the Student page.
      if (decoded.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (error) {
      // If the password is wrong, this block catches the error.
    }
  };

  // Line 36: This is the actual HTML code that gets drawn on the screen!
  return (
    <form onSubmit={handleLogin}>
      {/* We bind the email box to our 'email' memory state */}
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      {/* We bind the password box to our 'password' memory state */}
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  );
};
export default Login;
```

### 6. `RequestController.java` (Backend API for Student Requests)
This file handles the incoming web requests for students making requests and admins approving them.

```java
// Line 1: Listens for web requests.
@RestController
// Line 2: All URLs start with "/api/requests".
@RequestMapping("/api/requests")
public class RequestController {

    // Line 5: We bring in the RequestService containing the business logic.
    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    // Line 12: @PostMapping handles when a student SUBMITS a new request.
    @PostMapping
    // Line 13: SECURITY: Only Students can submit a request!
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<RequestResponseDto> submitRequest(@Valid @RequestBody RequestSubmissionDto dto, Authentication auth) {
        // Line 15: We pass the student's email (from their token) and their requested items to the service.
        return new ResponseEntity<>(requestService.submitRequest(auth.getName(), dto), HttpStatus.CREATED);
    }

    // Line 19: @PostMapping with "/{id}/approve" handles Admin approvals.
    @PostMapping("/{id}/approve")
    // Line 20: SECURITY: Only Admins can approve!
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<RequestResponseDto> approveRequest(
            // Line 22: We grab the ID from the URL, and the raw JWT token from the Authorization header.
            @PathVariable("id") Long id,
            Authentication auth,
            @RequestHeader("Authorization") String token) {
        
        // Line 27: We pass the ID, the Admin's email, and the token to the service. The token is needed so the Request Service can forward it to the Inventory Service!
        return ResponseEntity.ok(requestService.approveRequest(id, auth.getName(), token));
    }
}
```

### 7. `Register.jsx` (Frontend React Registration Page)
This file draws the Registration screen and handles creating a new user account.

```javascript
// Line 1-4: Import React tools.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

// Line 6: Start the Register Component.
const Register = () => {
  // Line 8-14: We create a single memory state object called 'formData' to hold all the inputs (Name, Email, Password, Role).
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ROLE_STUDENT'
  });
  const navigate = useNavigate();

  // Line 17: A smart function that updates 'formData' whenever the user types in ANY input box.
  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  // Line 21: Runs when the user clicks "Register".
  const handleRegister = async (e) => {
    e.preventDefault();
    // Line 23: First check if the passwords match!
    if (formData.password !== formData.confirmPassword) {
        return; // Stop if they don't match.
    }
    
    try {
      // Line 28-33: We package up the data exactly how the backend expects it.
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      
      // Line 35: We send the payload to the backend registration API.
      const response = await api.post('/auth/register', payload);
      
      // Line 36-39: If successful, the backend logs them in instantly and gives us a token. We save it.
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      // Line 41: Send them to their new dashboard!
      navigate('/student');
    } catch (error) {
      // Catch errors like "Email already exists".
    }
  };

  // Line 48: The HTML that gets drawn on screen.
  return (
    <form onSubmit={handleRegister}>
      {/* Input boxes bind to handleChange automatically using their 'name' attribute */}
      <input type="text" name="fullName" onChange={handleChange} />
      <input type="email" name="email" onChange={handleChange} />
      <input type="password" name="password" onChange={handleChange} />
      <button type="submit">Register</button>
    </form>
  );
};
export default Register;
```

### 8. `App.jsx` (Frontend React Router)
This is the "Traffic Cop" of the React application. It decides what page to show based on the URL.

```javascript
// Line 1-5: Import the Routing tools from 'react-router-dom'.
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Line 7: The main App component.
function App() {
  return (
    // Line 9: BrowserRouter enables URL tracking in the browser.
    <BrowserRouter>
      {/* Line 10: Routes acts as a switch statement. It stops at the first matching URL. */}
      <Routes>
        {/* Line 11: If the URL is just "/", automatically redirect them to "/login". */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Line 13-14: If the URL is "/login" or "/register", show those components. */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Line 16-20: If the URL is "/student", we wrap it in a <ProtectedRoute>. This checks if they actually have a valid token before letting them see the Dashboard! */}
        <Route path="/student" element={
          <ProtectedRoute requiredRole="ROLE_STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
```

### 9. `ApiGatewayApplication.java` (Backend API Gateway)
This is the entry point for all backend traffic.

```java
// Line 1: We declare the package.
package com.stationery.gateway;

// Line 3-4: We import the Spring Boot tools.
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

// Line 8: @SpringBootApplication tells Java this is the main application class.
@SpringBootApplication
// Line 9: @EnableDiscoveryClient tells this Gateway to connect to the Eureka Server so it can find the other microservices (like auth-service).
@EnableDiscoveryClient
public class ApiGatewayApplication {

    // Line 11: The absolute starting point of the Gateway server.
    public static void main(String[] args) {
        // Line 12: We boot up the application!
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
```
