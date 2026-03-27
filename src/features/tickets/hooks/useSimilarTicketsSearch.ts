import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { similarityService, type SimilarTicket } from '../services/similarityService';

export function useSimilarTicketsSearch(title: string, description: string) {
  const navigate = useNavigate();
  const [similarTickets, setSimilarTickets] = useState<SimilarTicket[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [solutionFound, setSolutionFound] = useState(false);

  const searchSimilarTickets = useMemo(
    () =>
      debounce(async (searchText: string) => {
        if (searchText.trim().length < 10) {
          setSimilarTickets([]);
          return;
        }

        setLoadingSimilar(true);
        try {
          const response = await similarityService.searchSimilar(searchText, 5, 0.3);
          setSimilarTickets(response.similar_tickets);

          if (response.found_count > 0) {
            console.log(`✓ Found ${response.found_count} similar tickets`);
          }
        } catch (error) {
          console.error('Similarity search failed:', error);
          setSimilarTickets([]);
        } finally {
          setLoadingSimilar(false);
        }
      }, 1000),
    []
  );

  useEffect(() => {
    const combinedText = `${title} ${description}`.trim();
    if (combinedText.length >= 10) {
      searchSimilarTickets(combinedText);
    } else {
      setSimilarTickets([]);
    }
  }, [title, description, searchSimilarTickets]);

  const handleSolutionFound = useCallback(() => {
    setSolutionFound(true);
    toast.success('Great! The solution helped. No need to create a ticket. 🎉', {
      duration: 4000,
    });
    setTimeout(() => {
      navigate('/tickets');
    }, 2000);
  }, [navigate]);

  return {
    similarTickets,
    loadingSimilar,
    solutionFound,
    handleSolutionFound,
  };
}
