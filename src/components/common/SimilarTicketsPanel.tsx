/**
 * Similar Tickets Panel Component
 * 
 * Shows similar resolved tickets with solutions when creating a new ticket.
 */
import React, { useState } from 'react';
import { Lightbulb, CheckCircle, ChevronRight, X, Loader2 } from 'lucide-react';
import { SimilarTicket } from '@/features/tickets/services/similarityService';
import { formatDistanceToNow } from 'date-fns';

interface SimilarTicketsPanelProps {
  similarTickets: SimilarTicket[];
  isLoading: boolean;
  onSolutionFound?: () => void;
}

export const SimilarTicketsPanel: React.FC<SimilarTicketsPanelProps> = ({
  similarTickets,
  isLoading,
  onSolutionFound
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SimilarTicket | null>(null);

  const openTicketModal = (ticket: SimilarTicket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
  };

  const handleSolutionFound = () => {
    closeModal();
    onSolutionFound?.();
  };

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-blue-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">
            Searching for similar issues...
          </span>
        </div>
      </div>
    );
  }

  if (similarTickets.length === 0) {
    return null;
  }

  return (
    <>
      {/* Similar Tickets Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4 mb-4 shadow-sm">
        <div className="flex items-start">
          <Lightbulb className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              💡 Similar Issues Found - Solutions Available
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              We found <strong>{similarTickets.length}</strong> similar resolved ticket
              {similarTickets.length > 1 ? 's' : ''}. Check if any solution helps before creating a new ticket:
            </p>

            <div className="space-y-2">
              {similarTickets.slice(0, 3).map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  className="bg-white p-3 rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all duration-200"
                  onClick={() => openTicketModal(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-500">
                          {ticket.ticket_number}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold">
                          {Math.round(ticket.similarity_score * 100)}% match
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {ticket.product}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        {ticket.title}
                      </div>
                      {ticket.solution_text && (
                        <div className="text-xs text-green-700 font-medium">
                          ✓ AI-generated solution available
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500">
                    {selectedTicket.ticket_number}
                  </span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                    {selectedTicket.status}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {Math.round(selectedTicket.similarity_score * 100)}% similar
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedTicket.title}
                </h2>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Priority:</span> {selectedTicket.priority}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Severity:</span> {selectedTicket.severity}
                  </span>
                  {selectedTicket.created_at && (
                    <>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Original Issue:
                </h3>
                <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.solution_text && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    AI-Generated Solution:
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.solution_text}
                    </p>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-gray-600 italic">
                        💡 This solution was AI-generated and summarized from resolved ticket comments. Sensitive data has been automatically masked for privacy.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!selectedTicket.solution_text && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No solution available for this ticket yet.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={handleSolutionFound}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  This Solved My Issue
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Continue Creating Ticket
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                If the solution helped, no ticket will be created
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};