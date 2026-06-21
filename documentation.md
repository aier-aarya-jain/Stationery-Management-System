# Stationery Management System - Code Documentation

This documentation is designed to help you understand and explain the project to an evaluator in **very simple language**. 

Because this project is a large, enterprise-grade application (using Microservices for the backend and React for the frontend), it contains thousands of lines of code. It is impossible to read every single line in a short evaluation. Instead, evaluators want to see that you understand the **Big Picture (Architecture)** and can explain **how a specific file works line-by-line**. 

This guide provides exactly that.

---

## 1. The Big Picture: How the Project Works

This project is divided into two main parts: the **Frontend** (what the user sees) and the **Backend** (the server logic and database). 

### The Frontend (React + Vite)
Located in the `frontend/` folder. This is the user interface.
* **React**: We use React to build the web pages (like Login, Dashboard, Admin Requests).
* **Vite**: A tool that builds and runs our React code very fast.
* **Tailwind/CSS**: Used to make the website look beautiful and modern.

### The Backend (Spring Boot Microservices)
Located in the `backend/` folder. Instead of having one giant server file, the backend is split into small, focused "mini-servers" called **Microservices**.
* **eureka-server**: The phonebook. It keeps track of where all the other services are running.
* **api-gateway**: The front door. The React frontend sends ALL requests here, and the gateway routes them to the correct service.
* **config-server**: Holds shared settings for all the services.
* **auth-service**: Handles user registration, login, and creates secure "JWT Tokens" so users stay logged in.
* **inventory-service**: Manages the stationery items (adding pens, deleting paper, checking stock).
* **request-service**: Handles students asking for stationery and admins approving/rejecting those requests.

---

## 2. Line-by-Line Explanation: Frontend (Login.jsx)

If the evaluator asks you to explain some React code, show them `frontend/src/pages/Login.jsx`. Here is what every line does in simple terms:

```javascript
// Lines 1-7: We import tools we need. React for the UI, 'react-router-dom' for moving between pages, 'axios' for sending requests to the backend, and 'jwtDecode' to read the login token.
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

// Line 9: We declare our main Login component function.
const Login = () => {
  // Lines 10-12: We create memory "states" to remember what the user types in the email box, password box, and if they want to see their password.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Line 13: We get a navigation tool so we can redirect the user after they log in.
  const navigate = useNavigate();

  // Line 15: This is the function that runs when the user clicks the "Sign In" button.
  const handleLogin = async (e) => {
    // Line 16: Stops the page from refreshing when the form is submitted.
    e.preventDefault();
    try {
      // Line 18: We send the email and password to our backend API (/auth/login).
      const response = await api.post('/auth/login', { email, password });
      
      // Line 19: The backend replies with a secure "token" if the password is correct.
      const { token, refreshToken } = response.data;
      
      // Lines 20-21: We save these tokens in the browser's local storage so the user stays logged in.
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Line 23: We read the token to see who the user is (Admin or Student).
      const decoded = jwtDecode(token);
      
      // Line 24: Show a green success popup message.
      toast.success('Login successful!');
      
      // Lines 26-30: If the user's role is Admin, send them to the Admin dashboard. Otherwise, send them to the Student dashboard.
      if (decoded.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (error) {
      // Lines 31-33: If the login fails (wrong password), the error is caught here (and handled automatically by another file).
    }
  };

  // Line 36: This starts the actual HTML (UI) that is drawn on the screen.
  return (
    // We use standard HTML divs to structure the page layout, with CSS classes to make it look nice.
    <div className="auth-container">
    
      {/* Visual left side of the login page */}
      <div className="auth-illustration">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '1rem' }}>Welcome Back!</h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>Manage your stationery requests seamlessly with our intelligent dashboard.</p>
        </motion.div>
      </div>

      {/* Right side containing the actual Login Form */}
      <div className="auth-form-wrapper">
        <motion.div className="glass-panel auth-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Sign In</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Access your dashboard</p>

          {/* Line 60: The form wrapper. When submitted, it triggers our handleLogin function. */}
          <form onSubmit={handleLogin}>
            
            {/* Email Input Field */}
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" className="input-field" placeholder="student@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {/* Password Input Field */}
            <div className="input-group" style={{ position: 'relative' }}>
              <label>Password</label>
              {/* If 'showPassword' is true, type is text. Otherwise, it hides the letters. */}
              <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              
              {/* Button to toggle the eye icon to see the password */}
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '2.1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-primary">Sign In</button>
          </form>

          {/* Link to go to the Register page if you don't have an account */}
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary-indigo)', fontWeight: '600', textDecoration: 'none' }}>Register</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Line 111: We export this Login component so it can be used in our main React App routing file.
export default Login;
```

---

## 3. Line-by-Line Explanation: Backend (InventoryController.java)

If the evaluator asks how the backend handles data, show them `backend/inventory-service/src/main/java/com/stationery/inventory/controller/InventoryController.java`. This file handles taking requests from the frontend and talking to the database.

```java
// Line 17: Declares which folder (package) this file lives in.
package com.stationery.inventory.controller;

// Lines 19-28: Imports (brings in) tools from the Spring Boot framework that we need to handle HTTP web requests, security, and pagination.
import com.stationery.inventory.dto.StationeryItemDto;
import com.stationery.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

// Line 36: @RestController tells Spring Boot that this class handles web requests (like GET and POST) and sends back JSON data.
@RestController
// Line 37: @RequestMapping tells the server that every web link inside this file starts with "/api/inventory".
@RequestMapping("/api/inventory")
// Line 38: @Slf4j is a tool that lets us print "log" messages to the console for debugging.
@Slf4j
public class InventoryController {

    // Line 41: We bring in the InventoryService, which contains all our heavy business logic and database commands.
    private final InventoryService inventoryService;

    // Lines 43-45: A constructor that Spring Boot uses to automatically inject the InventoryService into this controller.
    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // Line 61: @GetMapping means this function runs when the frontend makes a "GET" request to /api/inventory to fetch data.
    @GetMapping
    // Line 62: @PreAuthorize checks security. It ensures ONLY logged-in users who are ADMINS or STUDENTS can use this.
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_STUDENT')")
    public ResponseEntity<Page<StationeryItemDto>> getAllItems(
            // Lines 64-66: We check the URL for page numbers and sorting instructions. For example, /api/inventory?page=1&size=5
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "name") String sortBy,
            Authentication auth) {
        
        // Line 68: Prints a message to the console saying someone is fetching items.
        log.info("Fetching all items. Page: {}, Size: {}, SortBy: {}", page, size, sortBy);
        
        // Line 69: We ask the service to go get the items from the database, and we send the answer back (ResponseEntity.ok) to the frontend.
        return ResponseEntity.ok(inventoryService.getAllItems(page, size, sortBy, auth != null ? auth.getName() : "Anonymous", auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))));
    }

    // Line 84: @PostMapping means this function runs when the frontend sends new data to create something.
    @PostMapping
    // Line 85: @PreAuthorize ensures ONLY an ADMIN can add new stationery items. A student cannot run this code.
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<StationeryItemDto> addItem(@Valid @RequestBody StationeryItemDto dto, Authentication auth) {
        // Line 87: We ask the service to save the new item to the database, and return a "201 CREATED" success message.
        return new ResponseEntity<>(inventoryService.addItem(dto, auth.getName()), HttpStatus.CREATED);
    }

    // Line 103: @PutMapping updates an existing item. The "{id}" in the URL tells us WHICH item to update.
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<StationeryItemDto> updateItem(@PathVariable("id") Long id, @Valid @RequestBody StationeryItemDto dto, Authentication auth) {
        // Line 106: We pass the ID and the new data to the service to save in the database, and return the updated item.
        return ResponseEntity.ok(inventoryService.updateItem(id, dto, auth.getName()));
    }

    // Line 120: @DeleteMapping handles when the admin clicks a "Delete" button.
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteItem(@PathVariable("id") Long id, Authentication auth) {
        // Line 123: We tell the service to delete the item with this specific ID from the database.
        inventoryService.deleteItem(id, auth.getName());
        // Line 124: We send back a "204 No Content" response, meaning it was successfully deleted and there is nothing else to send back.
        return ResponseEntity.noContent().build();
    }
}
```

## 4. Centralized Configuration (Config Server)

Recently, this project was upgraded to use a centralized configuration architecture using Spring Cloud Config. Here is how it works:

* **The Problem:** Previously, every microservice (`auth-service`, `inventory-service`, etc.) had its own local `application.yml` file. If the database password changed, you had to manually edit 4 different files!
* **The Solution:** We introduced the `config-server`. This is a dedicated microservice whose sole job is to provide configuration data to the other services.
* **The `config-repo`:** All the individual configurations (like `auth-service.yml` and `inventory-service.yml`) are now stored in a single folder called `backend/config-repo`. The `config-server` reads from this folder.
* **How Services Startup:** The individual microservices now have a very basic `application.yml` that essentially says: "My name is auth-service. Please go ask the config-server at `http://localhost:8888` for my real configuration." They use the `spring-cloud-starter-config` dependency to do this automatically on startup.
* **Docker Compose Updates:** Because the microservices now depend on the `config-server` to know their database credentials and ports, the `docker-compose.yml` file was updated to strictly enforce the startup order using `depends_on`. Additionally, we map the local `config-repo` folder into the `config-server` Docker container using a volume (`./backend/config-repo:/config-repo`), and we use an environment variable (`SPRING_CONFIG_IMPORT`) to ensure the microservices look for the config server at its Docker hostname (`http://config-server:8888`) instead of localhost.

---

## 5. Summary for Evaluation

If the evaluator asks you to explain the codebase:
1. First, explain that this is a **Microservices Architecture**. You don't have one giant file; you have specific services (`auth-service`, `inventory-service`, etc.) that talk to each other through the `api-gateway`.
2. Second, explain that the frontend is a **React Application** built using Vite.
3. Third, if they ask to see code, show them the `Login.jsx` to prove you understand React state (`useState`), HTTP requests (`axios`), and routing (`navigate`).
4. Finally, show them the `InventoryController.java` to prove you understand Backend Endpoints, HTTP Methods (GET/POST), and Role-based Security (`@PreAuthorize`).
