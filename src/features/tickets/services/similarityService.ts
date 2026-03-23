import {ticketingApi} from '@/lib/axios';

export interface SimilarTicket {
  ticket_id: number;
  ticket_number: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  priority: string;
  product: string;
  created_at: string | null;
  similarity_score: number;
  solution_text: string; // AI-summarized solution with masked sensitive data
}

export interface SimilaritySearchResponse {
  similar_tickets: SimilarTicket[];
  found_count: number;
  min_similarity: number;
}

export const similarityService = {
  /**
   * Search for tickets similar to the given query
   */
  async searchSimilar(
    query: string,
    limit: number = 5,
    minSimilarity: number = 0.3
  ): Promise<SimilaritySearchResponse> {
    try {
      const response = await ticketingApi.get<SimilaritySearchResponse>(
        '/api/tickets/similarity',
        {
          params: {
            query,
            limit,
            min_similarity: minSimilarity
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Similarity search failed:', error);
      // Return empty results on error
      return {
        similar_tickets: [],
        found_count: 0,
        min_similarity: minSimilarity
      };
    }
  },

  /**
   * Generate embedding for a specific ticket (admin use)
   */
  async generateEmbedding(ticketId: number): Promise<void> {
    await ticketingApi.post(`/api/tickets/similarity/generate-embedding/${ticketId}`);
  },

  /**
   * Check health of similarity service
   */
  async healthCheck(): Promise<any> {
    const response = await ticketingApi.get('/api/tickets/similarity/health');
    return response.data;
  }
};