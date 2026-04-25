import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Handles downloading a CSV template and importing questions from CSV/Excel.
 * On import, uses InvokeLLM to parse/structure the questions.
 */
export default function QuestionImporter({ gameId, onImported }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const downloadTemplate = () => {
    const csv = `question,option_a,option_b,option_c,option_d,correct_answer
"What is 2 + 2?","3","4","5","6","4"
"What color is the sky?","Red","Blue","Green","Yellow","Blue"
"What is the capital of France?","London","Berlin","Paris","Madrid","Paris"`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      // Upload the file then use ExtractDataFromUploadedFile
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const schema = {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                correctAnswer: { type: 'string' },
              },
            },
          },
        },
      };

      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema,
      });

      if (extracted.status !== 'success' || !extracted.output?.questions?.length) {
        // Fallback: try InvokeLLM to parse raw text
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Parse this spreadsheet/CSV data into quiz questions. Each row has: question, option_a, option_b, option_c, option_d, correct_answer. Return an array of objects with: question (string), options (array of 4 strings), correctAnswer (string matching one of options). File URL: ${file_url}`,
          response_json_schema: schema,
        });
        if (!response?.questions?.length) throw new Error('Could not parse questions from file');
        await saveQuestions(response.questions, gameId);
        setResult({ count: response.questions.length });
        onImported?.(response.questions);
      } else {
        const qs = extracted.output.questions;
        await saveQuestions(qs, gameId);
        setResult({ count: qs.length });
        onImported?.(qs);
      }
      toast.success(`Imported questions successfully!`);
    } catch (err) {
      console.error('Import error:', err);
      setResult({ error: err.message });
      toast.error('Import failed: ' + err.message);
    }
    setImporting(false);
    e.target.value = '';
  };

  const saveQuestions = async (questions, gameId) => {
    if (!gameId) return;
    // Save each question to GameQuestion entity
    for (const q of questions) {
      await base44.entities.GameQuestion.create({
        gameId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      });
    }
  };

  return (
    <div className="border-t border-slate-100 px-3 py-3 bg-slate-50">
      <p className="text-xs font-semibold text-slate-600 mb-2">📋 Import Questions</p>
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={downloadTemplate}
          className="h-7 text-xs gap-1 rounded-lg"
        >
          <Download className="w-3 h-3" /> Template
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="h-7 text-xs gap-1 rounded-lg"
        >
          {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          Import CSV/Excel
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {result && (
        <div className={`mt-2 flex items-center gap-1.5 text-xs ${result.error ? 'text-red-500' : 'text-emerald-600'}`}>
          {result.error ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          {result.error ? result.error : `${result.count} questions imported!`}
        </div>
      )}
    </div>
  );
}