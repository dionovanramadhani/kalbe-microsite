export interface PostTestQuestion {
  id: number;
  question: string;
  options: string[];
}

export const POST_TEST_QUESTIONS: PostTestQuestion[] = [
  // Section 1 (Soal 1 - 3)
  {
    id: 1,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?",
    options: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
  },
  {
    id: 2,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?",
    options: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
  },
  {
    id: 3,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?",
    options: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
  },
  // Section 2 (Soal 4 - 6)
  {
    id: 4,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?",
    options: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
  },
  {
    id: 5,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?",
    options: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
  },
  {
    id: 6,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?",
    options: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
  },
  // Section 3 (Soal 7 - 9)
  {
    id: 7,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?",
    options: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
  },
  {
    id: 8,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?",
    options: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
  },
  {
    id: 9,
    question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?",
    options: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
  },
];
