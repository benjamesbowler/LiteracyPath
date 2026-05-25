import { publicDomainBooks } from "./publicDomainBooks.js";

export const publicDomainComprehensionQuestions = Object.fromEntries(
  publicDomainBooks.map(book => [
    book.id,
    book.comprehension || [
      {
        type: "open-response",
        question: "Who is this book mostly about?",
        options: [],
        correctAnswer: ""
      },
      {
        type: "open-response",
        question: "What happened at the beginning, middle, and end?",
        options: [],
        correctAnswer: ""
      }
    ]
  ])
);
