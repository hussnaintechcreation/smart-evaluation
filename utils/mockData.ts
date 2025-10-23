import type { Interview, InterviewResult } from '../types';

export const mockInterviews: Interview[] = [
  {
    id: 1001,
    title: 'Junior Frontend Developer Interview',
    questions: [
      'Tell me about your experience with React and its core principles.',
      'Describe a challenging frontend problem you solved and how you approached it.',
      'How do you ensure your web applications are responsive and accessible?',
      'What are some best practices for optimizing web performance?',
      'How do you stay updated with the latest trends in frontend development?'
    ],
  },
  {
    id: 1002,
    title: 'Senior Backend Engineer Interview',
    questions: [
      'Discuss your experience with Node.js and NestJS.',
      'How do you design scalable and fault-tolerant microservices?',
      'Explain common database optimization techniques in PostgreSQL.',
      'Describe your approach to API security and authentication.',
      'What is your experience with CI/CD pipelines and deployment strategies?'
    ],
  },
];

export const mockInterviewResult: InterviewResult = {
  interviewId: 1001,
  candidateName: 'Demo Candidate',
  analysis: {
    overallScore: 7,
    overallFeedback: 'The candidate demonstrated a foundational understanding of frontend concepts. There is room for improvement in providing more detailed examples and elaborating on problem-solving approaches.',
    summary: 'The candidate provided basic answers to React and responsive design. They struggled to give specific examples for challenging problems and performance optimization. Staying updated with trends was mentioned, but without concrete methods.',
    strengths: [
      'Basic understanding of React concepts.',
      'Awareness of responsive design principles.'
    ],
    improvements: [
      'Needs to provide more detailed and specific examples for challenges and solutions.',
      'Should elaborate more on performance optimization techniques beyond basic statements.',
      'Could improve on discussing methods for staying updated with trends.'
    ],
  },
  answers: {
    0: {
      transcript: 'My experience with React involves building components and using state and props. I understand the virtual DOM and how it helps with performance.',
      videoBase64: '', // In a real app, this would be a base64 encoded video
    },
    1: {
      transcript: 'A challenging problem was making a layout work on different screen sizes. I used media queries and flexible box layouts to achieve this.',
      videoBase64: '',
    },
    2: {
        transcript: 'I make sure applications are responsive by using CSS media queries and flexbox or grid. For accessibility, I try to use semantic HTML and ARIA attributes.',
        videoBase64: '',
    },
    3: {
        transcript: 'To optimize performance, I minified JavaScript and CSS, and used image compression. I also tried to reduce network requests.',
        videoBase64: '',
    },
    4: {
        transcript: 'I stay updated by reading blogs and tutorials, and sometimes watching videos about new technologies. I follow some developers on social media.',
        videoBase64: '',
    }
  },
  status: 'approved',
};
