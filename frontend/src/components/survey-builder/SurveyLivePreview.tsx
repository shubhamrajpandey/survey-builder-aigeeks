import React from 'react';
import { Survey } from '@survey/shared';
import { Modal } from '../ui/Modal';
import { SurveyForm } from '../survey-form/SurveyForm';

interface SurveyLivePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  survey: Survey;
}

export function SurveyLivePreview({ isOpen, onClose, survey }: SurveyLivePreviewProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview: ${survey.title || 'Untitled Survey'}`}
      description="Test your conditional rules and question flows exactly as respondents will see them."
      maxWidth="lg"
    >
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <SurveyForm survey={survey} isPreview={true} />
      </div>
    </Modal>
  );
}
