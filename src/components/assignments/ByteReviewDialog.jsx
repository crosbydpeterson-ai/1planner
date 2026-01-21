import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, RefreshCw, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const BYTE_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696e36c523c92e1a3cd5dbd6/e5d1726bd_image.png";

export default function ByteReviewDialog({ open, onOpenChange, assignment, onAccept, onRetry, onSkip }) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (open && assignment && !review) {
      reviewAssignment();
    }
  }, [open, assignment]);

  React.useEffect(() => {
    if (!open) {
      setReview(null);
      setError(null);
    }
  }, [open]);

  const reviewAssignment = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Byte, a friendly planner assistant for a school assignment tracker. Your job is to help make assignments CLEAR for other students.

Review this assignment that a student wants to add:
Title: "${assignment.title}"
Description: "${assignment.description || 'No description provided'}"

Your tasks:
1. CHECK if the assignment is understandable. Look for:
   - Vague terms (like "IXL", "do the thing", abbreviations others might not know)
   - Missing details (which pages? which lesson? what format?)
   - Confusing wording

2. If it's UNCLEAR, ask ONE clarifying question. Be specific, like:
   - "What IXL? There are many - which subject and lesson number?"
   - "What pages in which book?"
   - "Do what in Excel? Be more specific!"

3. If it's CLEAR but LONG, offer a shortened version.

4. If it's CLEAR and SHORT, approve it.

Respond in JSON. Be friendly and use casual language like a helpful robot friend!`,
        response_json_schema: {
          type: "object",
          properties: {
            status: { 
              type: "string", 
              enum: ["needs_clarification", "suggest_shorter", "approved"] 
            },
            question: { 
              type: "string", 
              description: "Question to ask if unclear (only for needs_clarification)" 
            },
            shortenedTitle: { 
              type: "string", 
              description: "Shorter title suggestion (only for suggest_shorter)" 
            },
            shortenedDescription: { 
              type: "string", 
              description: "Shorter description (only for suggest_shorter)" 
            },
            message: { 
              type: "string", 
              description: "Friendly message from Byte" 
            }
          }
        }
      });
      setReview(result);
    } catch (e) {
      setError('Byte had a glitch! Try again.');
    }
    setLoading(false);
  };

  const handleAcceptSuggestion = () => {
    if (review?.shortenedTitle) {
      onAccept({
        title: review.shortenedTitle,
        description: review.shortenedDescription || assignment.description
      });
    } else {
      onAccept(assignment);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img src={BYTE_IMAGE} alt="Byte" className="w-10 h-10 rounded-full" />
            <span>Byte's Review</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center py-8">
              <motion.img 
                src={BYTE_IMAGE} 
                alt="Byte thinking" 
                className="w-20 h-20 mb-4"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <p className="text-slate-500">Byte is checking your assignment...</p>
              <Loader2 className="w-5 h-5 mt-2 animate-spin text-sky-500" />
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={reviewAssignment} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : review ? (
            <div className="space-y-4">
              {/* Show original assignment */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Your assignment:</p>
                <p className="font-medium text-slate-800">{assignment.title}</p>
                {assignment.description && (
                  <p className="text-sm text-slate-600 mt-1">{assignment.description}</p>
                )}
              </div>

              {/* Byte's message */}
              <div className="bg-gradient-to-br from-sky-50 to-orange-50 rounded-xl p-4 border border-sky-100">
                <div className="flex gap-3">
                  <img src={BYTE_IMAGE} alt="Byte" className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div>
                    <p className="text-slate-700">{review.message}</p>
                    
                    {/* Show question if needs clarification */}
                    {review.status === 'needs_clarification' && review.question && (
                      <p className="mt-2 text-sky-700 font-medium">❓ {review.question}</p>
                    )}

                    {/* Show suggested shorter version */}
                    {review.status === 'suggest_shorter' && review.shortenedTitle && (
                      <div className="mt-3 bg-white rounded-lg p-3 border border-sky-200">
                        <p className="text-xs text-sky-600 mb-1">Byte's version:</p>
                        <p className="font-medium text-slate-800">{review.shortenedTitle}</p>
                        {review.shortenedDescription && (
                          <p className="text-sm text-slate-600 mt-1">{review.shortenedDescription}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {!loading && !error && review && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {review.status === 'needs_clarification' ? (
              <>
                <Button variant="ghost" onClick={() => onSkip(assignment)} className="flex-1">
                  Post Anyway
                </Button>
                <Button onClick={onRetry} className="flex-1 bg-sky-500 hover:bg-sky-600">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Edit & Retry
                </Button>
              </>
            ) : review.status === 'suggest_shorter' ? (
              <>
                <Button variant="ghost" onClick={() => onSkip(assignment)} className="flex-1">
                  Use Original
                </Button>
                <Button onClick={handleAcceptSuggestion} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                  <Check className="w-4 h-4 mr-2" />
                  Use Byte's Version
                </Button>
              </>
            ) : (
              <Button onClick={() => onAccept(assignment)} className="w-full bg-emerald-500 hover:bg-emerald-600">
                <Check className="w-4 h-4 mr-2" />
                Add Assignment
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}