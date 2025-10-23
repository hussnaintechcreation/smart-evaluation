import { GoogleGenAI } from '@google/genai';

/**
 * Centralizes the creation of the GoogleGenAI client.
 * This function acts as an abstraction layer for API key management.
 * In a production full-stack application, this is where you would implement
 * logic to communicate with a secure backend endpoint to avoid exposing the key
 * on the client. For this environment, we securely access the key from the
 * provided process.env, as per platform requirements.
 */
export function getGenAIClient() {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    // This provides a clear error in the console if the API key is not available,
    // which helps in debugging deployment or environment issues.
    console.error("Google GenAI API Key is missing. Please ensure it is set in the environment variables.");
    // Returning a new instance anyway, letting the underlying SDK handle the error
    // when a request is made, which might provide a more specific error message.
  }

  // Use the non-null assertion operator (!) on the apiKey to satisfy TypeScript's
  // strict null checks, ensuring the app compiles correctly. We rely on the
  // execution environment to provide a valid API_KEY.
  return new GoogleGenAI({ apiKey: apiKey! });
}