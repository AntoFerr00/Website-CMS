# Simple Content Management System (CMS)

## 📖 Overview

This project is a lightweight, full-stack Content Management System (CMS) built with a modern tech stack. It allows registered users to create, view, edit, and delete their own web pages through a simple and intuitive interface. The frontend is a dynamic single-page application built with React, and the backend is a robust Node.js server that manages user data and content in an SQLite database.

## ✨ Features

* **User Authentication:** Secure user registration and login system.

* **Page Management (CRUD):**

  * **Create:** Add new pages with a title and content.

  * **Read:** View a list of all your created pages.

  * **Update:** Modify existing pages.

  * **Delete:** Permanently remove pages.

* **Rich Text Editor:** A "What You See Is What You Get" (WYSIWYG) editor allows for creating visually appealing content with headings, bold/italic text, lists, and more.

* **RESTful API:** A well-defined backend API to handle all data operations.

## 💻 Tech Stack

* **Frontend:**

  * **React:** For building the user interface.

  * **TipTap:** A modern, headless rich text editor for creating content.

  * **Vite:** A fast and modern build tool for frontend development.

* **Backend:**

  * **Node.js:** A JavaScript runtime for the server.

  * **Express.js:** A web application framework for Node.js to build the API.

  * **SQLite:** A self-contained, serverless SQL database engine.

* **Authentication:**

  * **JSON Web Tokens (JWT):** For securing API routes and managing user sessions.

  * **bcrypt.js:** For hashing and securing user passwords.

## 🚀 Getting Started

To use the application, simply:

1. **Register:** Click the "Sign Up" link on the login page to create a new account with your email and password.

2. **Login:** Use your new credentials to sign in.

3. **Create Pages:** Once logged in, you'll see your page dashboard. Click the "New Page" button to open the editor and create your first page.

4. **Edit & Delete:** From the dashboard, you can choose to edit or delete any of the pages you have created.