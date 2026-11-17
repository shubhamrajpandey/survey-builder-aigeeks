import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Question } from '@survey/shared';
import { QuestionCard } from './QuestionCard';

interface QuestionListProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  onDeleteQuestion: (id: string) => void;
  disabled?: boolean;
}

export function QuestionList({
  questions,
  onChange,
  onDeleteQuestion,
  disabled = false,
}: QuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onChange(arrayMove(questions, oldIndex, newIndex));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    onChange(arrayMove(questions, index, index - 1));
  };

  const handleMoveDown = (index: number) => {
    if (index >= questions.length - 1) return;
    onChange(arrayMove(questions, index, index + 1));
  };

  const handleUpdate = (index: number, updated: Question) => {
    const copy = [...questions];
    copy[index] = updated;
    onChange(copy);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {questions.map((question, index) => {
            const earlier = questions.slice(0, index);

            return (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                totalQuestions={questions.length}
                earlierQuestions={earlier}
                allQuestions={questions}
                onUpdate={(updated) => handleUpdate(index, updated)}
                onDelete={onDeleteQuestion}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                disabled={disabled}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
