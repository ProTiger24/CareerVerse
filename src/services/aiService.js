const AI_BACKEND_URL = 'http://localhost:8000';

// ============ BASIC CHAT ============
export const askAICoach = async (query, context = 'career coaching for software engineers') => {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/api/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('AI Error:', error);
    return '❌ AI service unavailable. Please try again.';
  }
};

// ============ QUIZ ============
export const generateQuiz = async (subject, chapter = '', topic = '', numMcq = 5, numShort = 3, difficulty = 'medium') => {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/api/ai/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, chapter, topic, numMcq, numShort, difficulty })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { success: true, quiz: data };
  } catch (error) {
    console.error('Quiz generation error:', error);
    return { success: false, error: error.message };
  }
};

export const gradeQuiz = async (quiz, answers) => {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/api/ai/quiz/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz, answers })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { success: true, result: data };
  } catch (error) {
    console.error('Quiz grading error:', error);
    return { success: false, error: error.message };
  }
};

// ============ VIVA ============
export const startViva = async (subject, chapter = '', topic = '', difficulty = 'medium') => {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/api/ai/viva/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, chapter, topic, difficulty })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { success: true, data: await response.json() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const respondViva = async (subject, conversation, userAnswer, questionNumber) => {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/api/ai/viva/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, conversation, userAnswer, questionNumber })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { success: true, data: await response.json() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const gradeViva = async (subject, conversation) => {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/api/ai/viva/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, conversation })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { success: true, result: await response.json() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
