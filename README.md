# Familyhub OS

Welcome to **Familyhub OS**! This guide will help you get the application running on your computer, even if you've never run code before.

## Prerequisites

Before you start, make sure you have the following installed on your computer:

1.  **Node.js**: This is the engine that runs the code.
    *   Download and install the "LTS" (Long Term Support) version from [nodejs.org](https://nodejs.org/).
    *   To check if it's installed, open your terminal (Command Prompt on Windows, Terminal on Mac) and type `node -v`. You should see a version number like `v18.x.x`.

2.  **Git**: This helps you download the code.
    *   Download from [git-scm.com](https://git-scm.com/).

## Getting Started

Follow these steps one by one.

### 1. Download the Code
If you haven't already, open your terminal and navigate to where you want to save the project.

```bash
git clone https://github.com/Josechap/Familyhub.git
cd Familyhub
```

### 2. Setup the Server (Backend)
The "Server" is the brain of the application. It handles data and logic.

1.  Open a **new terminal window**.
2.  Navigate to the server folder:
    ```bash
    cd server
    ```
3.  Install the necessary tools (dependencies):
    ```bash
    npm install
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```
    *   **Success!** You should see: `Server running on http://localhost:3001`
    *   *Keep this terminal window open.*

### 3. Setup the Client (Frontend)
The "Client" is what you see on the screen (the dashboard, calendar, etc.).

1.  Open another **new terminal window**.
2.  Navigate to the client folder:
    ```bash
    cd client
    ```
3.  Install the necessary tools:
    ```bash
    npm install
    ```
4.  Start the application:
    ```bash
    npm run dev
    ```
    *   **Success!** You should see a message like: `Local: http://localhost:5173/`

### 4. Open the App
1.  Open your web browser (Chrome, Safari, Edge).
2.  Type this address into the bar: **http://localhost:5173**
3.  You should see the Familyhub Dashboard!

## Troubleshooting

*   **"Command not found"**: Make sure you installed Node.js and restarted your terminal.
*   **"Port already in use"**: This means another program is using the same "channel" as our app. You might need to close other running server windows.
*   **White screen?**: Check the terminal windows for any red error messages.

Need help? Ask the developer!
