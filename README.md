# ChatApp

## Description

ChatApp is a full-stack, real-time chat application designed to facilitate seamless communication between users. It allows individuals to register, log in, create or join chat rooms, and engage in instant messaging with other participants. Leveraging modern web technologies, ChatApp ensures a responsive, secure, and user-friendly experience across various devices.

## Features

- **User Authentication**
  - **Registration & Login:** Secure user registration and authentication system using JSON Web Tokens (JWT).
  - **Cookie-Based Sessions:** Maintains user sessions through HTTP-only cookies for enhanced security.

- **Chat Rooms**
  - **Create & Join Rooms:** Users can create new chat rooms or join existing ones based on their preferences.
  - **Leave Rooms:** Easy functionality to exit chat rooms, ensuring a clean user experience.

- **Real-Time Messaging**
  - **Instant Communication:** Implements WebSockets (`ws` library) for real-time, bidirectional messaging between clients and the server.
  - **Online Status:** Displays the total number of active connections in each chat room, providing users with real-time online status updates.

- **User Interface**
  - **Responsive Design:** Built with React and styled using Tailwind CSS to ensure a modern and responsive user interface.
  - **Interactive Elements:** Includes intuitive components such as message input fields, send buttons, and status indicators.

- **Security**
  - **Secure APIs:** Developed with Express and TypeScript, ensuring robust and maintainable backend services.
  - **Data Protection:** Utilizes JWT authentication and secure cookie handling to protect user data and communication.

- **Data Management**
  - **MongoDB Integration:** Employs MongoDB for efficient and scalable data storage, managing user information, chat rooms, and messages.

## Technologies Used

- **Front-End:**
  - **React:** For building dynamic and interactive user interfaces.
  - **Tailwind CSS:** For rapid and responsive UI styling.
  - **TypeScript:** Enhances code quality and maintainability with static typing.

- **Back-End:**
  - **Express:** A minimal and flexible Node.js web application framework.
  - **WS (WebSocket):** Implements real-time communication capabilities.
  - **TypeScript:** Ensures type safety and better developer experience.

- **Database:**
  - **MongoDB:** A NoSQL database for storing user data, chat rooms, and messages.

- **Authentication:**
  - **JWT (JSON Web Tokens):** For secure user authentication and authorization.
  - **Cookies:** Manages user sessions securely with HTTP-only cookies.

## Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/shivtriv12/ChatApp.git
    ```

2. **Navigate to the project directory:**
    ```bash
    cd chatapp
    ```

3. **Install dependencies for both client and server:**
    ```bash
    # For the server
    cd api
    npm i

    # For the client
    cd ../client
    npm i
    ```

4. **Set up environment variables:**
    - Create a `.env` file in the `server` directory with the necessary configurations (e.g., `JWT_SECRET`, `MONGODB_URL`).

5. **Run the application:**
    ```bash
    # In the server directory
    npm start

    # In the client directory
    npm start
    ```

## Usage

- **Register:** Create a new account by providing necessary details.
- **Login:** Access your account using your credentials.
- **Create Chat Room:** Initiate a new chat room for private or group conversations.
- **Join Chat Room:** Enter an existing chat room using its unique identifier.
- **Send Messages:** Communicate in real-time with other participants in the chat room.
- **View Online Members:** See the number of active users currently in the chat room.
