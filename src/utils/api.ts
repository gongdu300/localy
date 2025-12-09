
// src/utils/api.ts

interface ChatRequest {
    message: string;
    conversation_history?: Array<{ role: string; content: string }>;
    preferred_character?: string;
    destination?: string;
}

interface ChatResponse {
    response: string;
    agent_results?: {
        budget?: any;
        itinerary?: any;
        crowd_info?: any;
        [key: string]: any;
    };
}

export const api = {
    // 채팅 메시지 전송
    sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
        const response = await fetch('/api/langgraph/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        return response.json();
    },

    // 헬스 체크
    checkHealth: async () => {
        const response = await fetch('/api/langgraph/health');
        return response.json();
    }
};
