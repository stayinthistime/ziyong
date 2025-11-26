import React, { useState } from 'react';
import type { AnalysisResponse } from '../types';
import { CheckCircle, AlertCircle, BookOpen, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  data: AnalysisResponse;
}

export const AnalysisResult: React.FC<Props> = ({ data }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto animate-fade-in">
      {/* Diagnosis Card */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
        <div className="bg-red-50 px-6 py-4 flex items-center gap-3 border-b border-red-100">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-red-800">错因诊断</h3>
        </div>
        <div className="p-6 text-gray-700 leading-relaxed">
          {data.mistakeDiagnosis}
        </div>
      </div>

      {/* Core Concept Card */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="bg-blue-50 px-6 py-4 flex items-center gap-3 border-b border-blue-100">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-blue-800">核心考点: {data.coreConcept}</h3>
        </div>
        <div className="p-6 bg-slate-50">
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-700 mb-2">正确解题步骤：</h4>
            {data.stepByStepSolution.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="pt-1 text-gray-700">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Practice Question Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
        <div className="bg-white/50 px-6 py-4 flex items-center gap-3 border-b border-indigo-100 backdrop-blur-sm">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-800">举一反三（巩固练习）</h3>
        </div>
        <div className="p-6">
          <p className="font-medium text-gray-800 mb-6 bg-white p-4 rounded-lg border border-indigo-50 shadow-sm">
            {data.practiceQuestion.question}
          </p>

          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition-colors focus:outline-none"
          >
            {showAnswer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAnswer ? '收起答案解析' : '查看答案与解析'}
          </button>

          {showAnswer && (
            <div className="mt-4 pt-4 border-t border-indigo-100 animate-slide-down">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900">答案：</span>
                  <span className="text-gray-800">{data.practiceQuestion.answer}</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed pl-8">
                <span className="font-semibold text-gray-700">解析：</span>
                {data.practiceQuestion.explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};