import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SurveyForm } from '../components/survey-form/SurveyForm';
import { Survey } from '@survey/shared';

describe('SurveyForm Component', () => {
  const testSurvey: Survey = {
    title: 'Customer Experience Survey',
    questions: [
      {
        id: 'q1',
        type: 'single_choice',
        label: 'Do you use our application?',
        required: true,
        options: ['Yes', 'No'],
      },
      {
        id: 'q2',
        type: 'rating',
        label: 'How would you rate your experience?',
        required: true,
        condition: {
          questionId: 'q1',
          operator: 'equals',
          value: 'Yes',
        },
      },
      {
        id: 'q3',
        type: 'text',
        label: 'Why not?',
        required: true,
        condition: {
          questionId: 'q1',
          operator: 'equals',
          value: 'No',
        },
      },
    ],
  };

  it('renders Q1 initially while Q2 and Q3 stay hidden', () => {
    render(<SurveyForm survey={testSurvey} />);

    expect(screen.getByText('Do you use our application?')).toBeInTheDocument();
    expect(screen.queryByText('How would you rate your experience?')).not.toBeInTheDocument();
    expect(screen.queryByText('Why not?')).not.toBeInTheDocument();
  });

  it('reveals Q2 when Q1 = "Yes" and Q3 remains hidden', () => {
    render(<SurveyForm survey={testSurvey} />);

    const yesRadio = screen.getByLabelText('Yes');
    fireEvent.click(yesRadio);

    expect(screen.getByText('How would you rate your experience?')).toBeInTheDocument();
    expect(screen.queryByText('Why not?')).not.toBeInTheDocument();
  });

  it('drops hidden question answers when user switches selection', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SurveyForm survey={testSurvey} onSubmit={handleSubmit} />);

    // Select Yes -> reveals Q2
    fireEvent.click(screen.getByLabelText('Yes'));
    expect(screen.getByText('How would you rate your experience?')).toBeInTheDocument();

    // Rate 5 stars
    const star5 = screen.getByLabelText(/Rate 5 out of 5 stars/i);
    fireEvent.click(star5);

    // Switch Q1 to No -> Q2 hides, Q3 reveals
    fireEvent.click(screen.getByLabelText('No'));
    expect(screen.queryByText('How would you rate your experience?')).not.toBeInTheDocument();
    expect(screen.getByText('Why not?')).toBeInTheDocument();

    // Fill Q3
    const textInput = screen.getByPlaceholderText('Type your answer here...');
    fireEvent.change(textInput, { target: { value: 'Too complex' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit Response/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const [submittedAnswers] = handleSubmit.mock.calls[0];
    expect(submittedAnswers).toEqual({
      q1: 'No',
      q3: 'Too complex',
    });
    // Q2 answer must have been dropped from state!
    expect(submittedAnswers.q2).toBeUndefined();
  });

  it('shows required validation error when visible field is left empty and prevents submission', async () => {
    const handleSubmit = vi.fn();
    render(<SurveyForm survey={testSurvey} onSubmit={handleSubmit} />);

    // Select Yes -> Q2 is visible and required, but unselected
    fireEvent.click(screen.getByLabelText('Yes'));

    const submitBtn = screen.getByRole('button', { name: /Submit Response/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/This question is required/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('successfully submits valid responses with cleaned answers', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SurveyForm survey={testSurvey} onSubmit={handleSubmit} />);

    fireEvent.click(screen.getByLabelText('Yes'));

    const star4 = screen.getByLabelText(/Rate 4 out of 5 stars/i);
    fireEvent.click(star4);

    const submitBtn = screen.getByRole('button', { name: /Submit Response/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit).toHaveBeenCalledWith({ q1: 'Yes', q2: 4 }, '');
  });
});
