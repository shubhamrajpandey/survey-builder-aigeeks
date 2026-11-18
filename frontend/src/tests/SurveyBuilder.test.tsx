import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { SurveyBuilderPage } from '../pages/SurveyBuilderPage';

function renderBuilder() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <SurveyBuilderPage />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('SurveyBuilderPage Component', () => {
  it('renders default survey with Q1 and allows adding new questions', () => {
    renderBuilder();

    expect(screen.getByText('Survey Title')).toBeInTheDocument();
    expect(screen.getByText(/Questions \(1\)/i)).toBeInTheDocument();

    // Click "Multi-Select" button in Add Question menu
    const addMultiBtn = screen.getByRole('button', { name: /Multi-Select/i });
    fireEvent.click(addMultiBtn);

    // Questions count should update to 2
    expect(screen.getByText(/Questions \(2\)/i)).toBeInTheDocument();
  });

  it('allows configuring a condition on an earlier question', () => {
    renderBuilder();

    // Add a second question
    const addRatingBtn = screen.getByRole('button', { name: /1-5 Star Rating/i });
    fireEvent.click(addRatingBtn);

    // Locate the condition checkbox on the second question
    const conditionCheckboxes = screen.getAllByRole('checkbox', {
      name: /Show only conditionally.../i,
    });
    // The second question has an active earlier question, so its checkbox should be enabled
    expect(conditionCheckboxes[1]).not.toBeDisabled();

    fireEvent.click(conditionCheckboxes[1]);

    // Parent question select should appear
    expect(screen.getByText(/Parent Question/i)).toBeInTheDocument();
  });

  it('first question cannot have conditional logic because it has no earlier questions', () => {
    renderBuilder();

    const conditionCheckboxes = screen.getAllByRole('checkbox', {
      name: /Show only conditionally.../i,
    });

    // The first question has no earlier question, so it is disabled
    expect(conditionCheckboxes[0]).toBeDisabled();
    expect(screen.getByText(/Requires at least one preceding question/i)).toBeInTheDocument();
  });

  it('displays inline warning when reordering moves a conditional question before its parent', () => {
    renderBuilder();

    // Add a second question
    const addRatingBtn = screen.getByRole('button', { name: /1-5 Star Rating/i });
    fireEvent.click(addRatingBtn);

    // Turn on conditional logic for Q2
    const conditionCheckboxes = screen.getAllByRole('checkbox', {
      name: /Show only conditionally.../i,
    });
    fireEvent.click(conditionCheckboxes[1]);

    // Q2 now depends on Q1. Move Q2 up above Q1!
    const moveUpButtons = screen.getAllByRole('button', { name: /Move question up/i });
    fireEvent.click(moveUpButtons[1]);

    // Now Q2 has moved to position 0, before Q1. The invalid condition warning should appear!
    expect(screen.getByText('Invalid Condition Order')).toBeInTheDocument();
    expect(screen.getByText(/Conditions can only depend on earlier questions/i)).toBeInTheDocument();
  });
});
