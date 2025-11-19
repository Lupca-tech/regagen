<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Regagen API

This is the backend API for the Regagen content generation platform, powered by Google's Gemini AI.

## Run Locally

**Prerequisites:**
- Node.js (v18 or newer recommended)

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**
    Create a `.env` file in the root directory and add your Gemini API key:
    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

3.  **Run the app:**
    For development with auto-reloading:
    ```bash
    npm run dev
    ```
    To run in production mode:
    ```bash
    npm start
    ```
    The server will be running on `http://localhost:3001`.

## API Documentation

API documentation is available via Swagger UI once the server is running.
- **Swagger Docs:** `http://localhost:3001/docs`
- **Swagger JSON:** `http://localhost:3001/swagger.json`
