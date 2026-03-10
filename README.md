# 💊 Medication Tracker Project

The **Medication Tracker** is a full-stack web application designed to help users manage and track their medications effectively. It allows users to register, log in, and maintain a record of their medicines, helping them avoid missing doses and maintain better health.

This project is built using a **Spring Boot backend**, **React frontend**, and **MySQL database**.

---

# 📚 Project Theory

## Introduction

Medication adherence is important for maintaining good health. Many people forget to take their medicines on time, which can lead to serious health issues.

The **Medication Tracker** application solves this problem by providing a **digital platform where users can manage their medications, track dosage schedules, and maintain records easily**.

The system follows a **client-server architecture**, where:

- **Frontend (React)** handles the user interface
- **Backend (Spring Boot)** manages business logic and APIs
- **MySQL** stores user and medication data

---

# 🛠️ Technologies Used

## Frontend
- React.js
- HTML
- CSS
- JavaScript
- Axios

## Backend
- Spring Boot
- Spring Web
- Spring Data JPA
- REST APIs
- Maven

## Database
- MySQL

## Tools
- Node.js
- npm
- Java 17+
- Postman (API testing)

---

# 🏗️ System Architecture

The application follows a **three-tier architecture**.

## 1️⃣ Presentation Layer
The **React frontend** provides the user interface where users can:
- Register
- Login
- Manage medications

## 2️⃣ Application Layer
The **Spring Boot backend** processes user requests and handles:
- Authentication
- Business logic
- API endpoints

## 3️⃣ Data Layer
The **MySQL database** stores:
- User information
- Medication records

---

# ⚙️ Prerequisites

Before running the project, ensure the following software is installed:

1. **Java 17 or higher**
2. **Node.js and npm**
3. **MySQL Server running on localhost:3306**

---

# 🔧 Backend Setup  
`medication-tracker-backend`

## 1. Create Database

Run the following SQL command in MySQL:

```sql
CREATE DATABASE medication_db;
```
2. Configure Credentials

Open:

src/main/resources/application.properties

Update database credentials:

spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.url=jdbc:mysql://localhost:3306/medication_db
spring.jpa.hibernate.ddl-auto=update
3. Run the Application

Navigate to the backend folder and run:

.\mvnw.cmd spring-boot:run

Backend will start at:
```
http://localhost:8080
```
# 💻 Frontend Setup

medication-tracker-frontend

1. Install Dependencies

Navigate to the frontend directory:
```
npm install
```
2. Run Application

Start the React development server:
```
npm start
```

Frontend will run at:
```
http://localhost:3000
```

---

# 🔌 API Endpoints

You can test APIs using Postman.

Register User
POST http://localhost:8080/auth/register

Creates a new user account.

Login User
POST http://localhost:8080/auth/login

Authenticates the user.

---

# 🧪 API Testing

Steps to verify the system:

Start Spring Boot backend

Start React frontend

Test APIs using Postman

Access UI in the browser

---

# 🚀 Features

User Registration

User Login Authentication

Medication Management

Secure Data Storage

REST API Architecture

Responsive User Interface

---

# 🎯 Advantages

Helps users remember medication schedules

Easy authentication system

User-friendly interface

Scalable full-stack architecture

# 🔮 Future Enhancements

Medication reminder notifications

Email or SMS alerts

Mobile application version

Doctor and pharmacy integration

Medication analytics dashboard

# ✅ Conclusion

The Medication Tracker project demonstrates the use of modern full-stack technologies such as React, Spring Boot, and MySQL to build a healthcare support system. The system provides an efficient way to digitally manage medication schedules and improve adherence.


---
