export interface PostTestQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number; // 0-indexed index of correct answer
}

export const POST_TEST_QUESTIONS: PostTestQuestion[] = [
  {
    id: 1,
    question: "Yang dimaksud dengan bifidogenic factor adalah...",
    options: [
      "Bakteri hidup yang bila dikonsumsi dalam jumlah cukup memberi manfaat kesehatan bagi inang",
      "Substansi yang secara selektif merangsang pertumbuhan dan/atau aktivitas Bifidobacterium di saluran cerna",
      "Enzim pencernaan yang membantu hidrolisis laktosa di usus halus",
      "Antibodi dalam ASI yang menetralkan bakteri pathogen",
    ],
    correctAnswer: 1,
  },
  {
    id: 2,
    question:
      "Komponen dalam ASI yang berperan sebagai bifidogenic factor alami utama dan merupakan komponen padat terbanyak adalah…",
    options: [
      "Kasein",
      "Laktoferin",
      "Human Milk Oligosaccharides (HMO)",
      "Imunoglobulin A sekretori (sIgA)",
    ],
    correctAnswer: 2,
  },
  {
    id: 3,
    question:
      "Pada bayi yang mendapat ASI, mikrobiota usus cenderung didominasi oleh…",
    options: [
      "Clostridium",
      "Bifidobacterium",
      "Escherichia",
      "Bacteroides",
    ],
    correctAnswer: 1,
  },
  {
    id: 4,
    question:
      "Protein dalam ASI yang mampu mengikat zat besi dan diketahui memiliki efek bifidogenik adalah...",
    options: [
      "Kasein",
      "Lisozim",
      "Laktoferin",
      "Alfa-laktalbumin",
    ],
    correctAnswer: 2,
  },
  {
    id: 5,
    question: "Berikut ini yang BUKAN termasuk bifidogenic factor adalah...",
    options: [
      "Laktoferin",
      "Fruktooligosakarida",
      "Galaktooligosakarida",
      "Sukrosa",
    ],
    correctAnswer: 3,
  },
];
