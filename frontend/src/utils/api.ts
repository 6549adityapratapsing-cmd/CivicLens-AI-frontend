import {
  CivicAnalysisResponse,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  AIHealthResponse,
} from '../types';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000'
).replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  actionableTip?: string;

  constructor(message: string, status: number = 500, actionableTip?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.actionableTip = actionableTip;
  }
}

/**
 * Check backend service liveness
 */
export async function checkServiceHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new ApiError(`Service health returned HTTP ${res.status}`, res.status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      `Cannot connect to backend server at ${API_BASE_URL}. Ensure the FastAPI server is running.`,
      0,
      'Start the backend with: uvicorn main:app --reload'
    );
  }
}

/**
 * Check AI provider connectivity and readiness
 */
export async function checkAIHealth(): Promise<AIHealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health/ai`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const detail = errorJson.detail || `AI health returned HTTP ${res.status}`;
      throw new ApiError(detail, res.status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      `Failed to verify AI provider status: ${err.message}`,
      0,
      'Check backend connection and environment variables.'
    );
  }
}

/**
 * Fetch list of discovered models from Ollama / active provider
 */
export async function fetchAvailableModels(): Promise<{
  provider: string;
  configured_model: string;
  available_models: string[];
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/models`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { provider: 'ollama', configured_model: 'gemma3:1b', available_models: [] };
    }
    return await res.json();
  } catch {
    return { provider: 'ollama', configured_model: 'gemma3:1b', available_models: [] };
  }
}

/**
 * Submit civic evidence (image, category, description, language) for AI analysis
 */
export async function analyzeCivicIssue(
  formData: FormData
): Promise<CivicAnalysisResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let detailMsg = `Analysis failed with HTTP ${res.status}`;
      let actionableTip: string | undefined;

      try {
        const errorData = await res.json();
        if (errorData.detail) {
          detailMsg = errorData.detail;
        }
      } catch {
        // use status text fallback
      }

      if (res.status === 401) {
        actionableTip = 'Set a valid GEMINI_API_KEY in backend/.env or your deployment environment.';
      } else if (res.status === 413) {
        actionableTip = 'Please upload an image smaller than 10MB.';
      } else if (res.status === 415) {
        actionableTip = 'Upload a JPEG, PNG, or WEBP image.';
      } else if (res.status === 503) {
        actionableTip =
          'Ensure the configured AI provider (Gemini key or local Ollama) is configured and running.';
      } else if (res.status === 504) {
        actionableTip = 'The AI inference timed out. Please try again or test with a smaller image.';
      }

      throw new ApiError(detailMsg, res.status, actionableTip);
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err.message || 'Network error occurred while connecting to the backend.',
      0,
      'Ensure the backend server is running and CORS allows your frontend origin.'
    );
  }
}

/**
 * Send interactive citizen inquiry to the AI civic assistant
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const detail = errorJson.detail || `Chat request failed with HTTP ${res.status}`;
      throw new ApiError(detail, res.status);
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err.message || 'Network error while sending chat inquiry.',
      0,
      'Check backend connection.'
    );
  }
}
