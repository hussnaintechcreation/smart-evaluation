import React, { useState, useRef, useMemo } from 'react';
import './CandidateManagement.css';

// REFACTOR: This data is now the default/initial state, managed in App.tsx
// It's exported so App.tsx can use it as the initial value.
export const initialCandidates = [
  {
    id: 1,
    name: 'Alex Doe',
    // FEAT: Add new detailed fields to the candidate data model
    fatherName: 'Richard Doe',
    gender: 'Male',
    dob: '1990-05-15',
    cnic: '12345-1234567-1',
    email: 'hussnaintechcreation@gmail.com', // Updated email for demo login
    status: 'Approved',
    interviewHistory: [
        {
            id: 'int-101', role: 'Senior Frontend Developer', date: '2024-05-10', score: 87,
            // FEAT: Add company field for multi-organization support
            company: 'Innovate Inc.',
            interviewLog: [
                {
                    id: 'log-101-1', // Added unique ID
                    question: "Describe your experience with performance optimization in a large-scale React application.",
                    answer: "In my previous project, we faced significant performance issues with a data-heavy dashboard. I led the effort to optimize it by implementing several strategies. First, I used React.memo and useMemo to prevent unnecessary re-renders of complex components. Then, I introduced code-splitting using React.lazy to reduce the initial bundle size. We also virtualized our large lists with react-window, which dramatically improved rendering speed. The final result was a 60% reduction in initial load time and a much smoother user experience.",
                    manualScore: null, // Added manual score
                },
                {
                    id: 'log-101-2', // Added unique ID
                    question: "How do you approach accessibility (a11y) in your projects?",
                    answer: "Accessibility is a priority for me. I follow WCAG guidelines and incorporate a11y from the start. This includes using semantic HTML, managing focus for keyboard navigation, ensuring sufficient color contrast, and adding ARIA attributes where necessary. I also regularly use screen reader tools like VoiceOver to test the application's usability for visually impaired users. I believe building accessible applications is crucial for an inclusive web.",
                    manualScore: null, // Added manual score
                }
            ]
        },
        { id: 'int-100', role: 'Mid-Level React Engineer', date: '2024-03-02', score: 92, company: 'Tech Solutions LLC', interviewLog: [] },
    ]
  },
  {
    id: 2,
    name: 'Samantha Jones',
    fatherName: 'Robert Jones',
    gender: 'Female',
    dob: '1992-08-22',
    cnic: '54321-7654321-2',
    email: 'samantha.jones@example.com',
    status: 'Awaiting Review',
    interviewHistory: [
      { id: 'int-102', role: 'Senior Frontend Developer', date: '2024-05-12', score: null, company: 'Innovate Inc.',
        jobTitle: 'Senior Frontend Developer',
        jobDescription: 'Seeking a senior frontend developer with 5+ years of experience in React, TypeScript, and modern state management. The ideal candidate will have a strong eye for design and a passion for performance and accessibility.',
        timer: 90,
        categories: ['Technical', 'Behavioral'],
        interviewLog: [
            {
                id: 'log-102-1', // Added unique ID
                question: "Can you walk me through your experience with React and state management libraries like Redux or MobX?",
                answer: "Sure. I've worked extensively with React for about five years now. In my previous role, I was the lead on a project where we used Redux for managing a very complex application state with lots of asynchronous actions. I'm very comfortable with writing actions, reducers, and using middleware like Redux Thunk. I've also dabbled with MobX on personal projects and appreciate its simplicity for smaller-scale apps.",
                manualScore: null, // Added manual score
            },
            {
                id: 'log-102-2', // Added unique ID
                question: "Describe a challenging project you worked on. What was the problem, what was your role, and what was the outcome?",
                answer: "The most challenging project was a legacy code migration from Angular.js to React. I was responsible for planning the phased rollout to avoid disrupting users. The main problem was untangling years of coupled code. We successfully migrated the entire application over six months with zero downtime, which was a huge win.",
                manualScore: null, // Added manual score
            }
        ]
      },
    ]
  },
  {
    id: 3,
    name: 'Michael Chen',
    fatherName: 'David Chen',
    gender: 'Male',
    dob: '1995-01-30',
    cnic: '67890-1234567-3',
    email: 'michael.chen@example.com',
    status: 'Pending',
    interviewHistory: []
  },
  {
    id: 4,
    name: 'Jessica Davis',
    fatherName: 'William Davis',
    gender: 'Female',
    dob: '1988-11-10',
    cnic: '09876-5432109-4',
    email: 'jessica.davis@example.com',
    status: 'Pending',
    interviewHistory: []
  },
];

const filterOptions = ['All', 'Pending', 'Awaiting Review', 'Approved'];

const getProgressProps = (status) => {
    switch (status) {
        case 'Pending':
            return { percentage: 10, colorClass: 'progress-pending' };
        case 'Awaiting Review':
            return { percentage: 60, colorClass: 'progress-review' };
        case 'Approved':
            return { percentage: 100, colorClass: 'progress-approved' };
        default:
            return { percentage: 0, colorClass: '' };
    }
};

interface ProcessedEmails {
  validEmails: string[];
  invalidEmails: string[];
  duplicateEmails: string[];
}

export const CandidateManagement = ({ candidates, onAddCandidates, onDeleteCandidate, navigate }) => {
  const [newCandidateEmail, setNewCandidateEmail] = useState('');
  const [newCandidateName, setNewCandidateName] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [bulkEmails, setBulkEmails] = useState(''); // Textarea input for bulk emails
  const [isBulkInviting, setIsBulkInviting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<{ field: string, message: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: 'email' | 'status' | 'score', direction: 'ascending' | 'descending' }>({ key: 'email', direction: 'ascending' });
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkInviteFeedback, setBulkInviteFeedback] = useState<{ type: 'error' | 'warning' | 'success', message: string }[]>([]);
  // New state for CSV preview
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewEmails, setCsvPreviewEmails] = useState<string[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);


  const handleInvite = async (e) => {
    e.preventDefault();
    setError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCandidateEmail)) {
        setError({ field: 'invite', message: 'Please enter a valid email address.' });
        return;
    };
    if (candidates.some(c => c.email.toLowerCase() === newCandidateEmail.toLowerCase())) {
        setError({ field: 'invite', message: 'This candidate has already been invited.' });
        return;
    }

    setIsInviting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const maxId = candidates.length > 0 ? Math.max(...candidates.map(c => c.id)) : 0;
    const newCandidate = {
      id: maxId + 1,
      name: newCandidateName.trim() || 'New Candidate', // Store provided name or default
      email: newCandidateEmail,
      // Add empty values for new detailed fields
      fatherName: '',
      gender: '',
      dob: '',
      cnic: '',
      status: 'Pending',
      interviewHistory: [],
    };
    onAddCandidates([newCandidate]);
    setNewCandidateEmail('');
    setNewCandidateName(''); // Clear the name input field
    setIsInviting(false);
  };

  const processEmails = (emailList: string[]): ProcessedEmails => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const existingEmails = new Set(candidates.map(c => c.email.toLowerCase()));
    
    let valid = new Set<string>();
    let invalid: string[] = [];
    let duplicates: string[] = [];

    emailList.forEach(email => {
      const trimmedEmail = email.trim();
      const lowercasedEmail = trimmedEmail.toLowerCase();
      if (trimmedEmail) {
        if (existingEmails.has(lowercasedEmail)) {
          duplicates.push(trimmedEmail);
        } else if (emailRegex.test(trimmedEmail)) {
          valid.add(lowercasedEmail);
        } else {
          invalid.push(trimmedEmail);
        }
      }
    });
    return { validEmails: Array.from(valid), invalidEmails: invalid, duplicateEmails: duplicates };
  };

  // Refactored function to process and send invites
  const processAndSendInvites = async (emailsToProcess: string[]) => {
    setIsBulkInviting(true);
    setBulkInviteFeedback([]); // Clear previous feedback
    setError(null); // Clear any general errors

    if (emailsToProcess.length === 0) {
        setError({ field: 'bulk', message: 'No email addresses provided or found to invite.' });
        setIsBulkInviting(false);
        return;
    }
  
    const { validEmails, invalidEmails, duplicateEmails } = processEmails(emailsToProcess);
    const feedbackMessages: { type: 'error' | 'warning' | 'success', message: string }[] = [];

    invalidEmails.forEach(email => feedbackMessages.push({ type: 'error', message: `Invalid email format: ${email}` }));
    duplicateEmails.forEach(email => feedbackMessages.push({ type: 'warning', message: `Duplicate email (already invited): ${email}` }));

    if (validEmails.length === 0 && feedbackMessages.length > 0) {
        setBulkInviteFeedback(feedbackMessages);
        setIsBulkInviting(false);
        return;
    } else if (validEmails.length === 0 && feedbackMessages.length === 0) {
        setError({ field: 'bulk', message: 'No new valid email addresses found to invite.' });
        setIsBulkInviting(false);
        return;
    }
  
    await new Promise(resolve => setTimeout(resolve, 1500));
  
    let currentMaxId = candidates.length > 0 ? Math.max(...candidates.map(c => c.id)) : 0;
    const newCandidates = validEmails.map(email => {
      currentMaxId++;
      return {
        id: currentMaxId,
        name: 'New Candidate',
        email: email,
        fatherName: '',
        gender: '',
        dob: '',
        cnic: '',
        status: 'Pending',
        interviewHistory: [],
      };
    });
  
    onAddCandidates(newCandidates);
  
    if (newCandidates.length > 0) {
        feedbackMessages.unshift({ type: 'success', message: `Successfully invited ${newCandidates.length} candidate(s).` });
    }
    setBulkInviteFeedback(feedbackMessages);
    setIsBulkInviting(false); // End bulk inviting state
  };

  const handleBulkInviteSubmit = (e) => {
    e.preventDefault();
    setCsvFile(null); // Clear any pending CSV file state
    setShowCsvPreview(false); // Ensure preview is hidden
    setBulkInviteFeedback([]); // Clear feedback for new submission
    processAndSendInvites(bulkEmails.split(/[,\s\n;]+/).filter(email => email.trim() !== ''));
    setBulkEmails(''); // Clear textarea after sending
  };

  const handleCsvUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setBulkInviteFeedback([]); // Clear previous feedback
    setBulkEmails(''); // Clear textarea content if file is selected

    const file = e.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      setCsvPreviewEmails([]);
      setShowCsvPreview(false);
      return;
    }

    if (!file.type.startsWith('text/csv') && !file.name.endsWith('.csv')) {
      setError({ field: 'bulk', message: 'Invalid file type. Please upload a .csv file.' });
      setCsvFile(null);
      setCsvPreviewEmails([]);
      setShowCsvPreview(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
      return;
    }

    setCsvFile(file);
    try {
      const text = await file.text();
      const parsedEmails = text.split(/[\n,;]/).filter(line => line.trim() !== '');
      if (parsedEmails.length === 0) {
        setError({ field: 'bulk', message: 'No email addresses found in the CSV file.' });
        setCsvFile(null);
        setCsvPreviewEmails([]);
        setShowCsvPreview(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setCsvPreviewEmails(parsedEmails);
      setShowCsvPreview(true);
    } catch (readError) {
      setError({ field: 'bulk', message: 'Error reading file. It may be corrupted or not plain text.' });
      setCsvFile(null);
      setCsvPreviewEmails([]);
      setShowCsvPreview(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmCsvInvite = () => {
    setShowCsvPreview(false);
    processAndSendInvites(csvPreviewEmails);
    setCsvFile(null);
    setCsvPreviewEmails([]);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
  };

  const handleCancelCsvPreview = () => {
    setShowCsvPreview(false);
    setCsvFile(null);
    setCsvPreviewEmails([]);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
  };


  const handleDeleteCandidateClick = (candidateId: number) => {
    if (window.confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
        onDeleteCandidate(candidateId);
    }
  };

  const getStatusClass = (status) => {
    return `status-${status.toLowerCase().replace(/ /g, '')}`;
  };
  
  const requestSort = (key: 'email' | 'status' | 'score') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: 'email' | 'status' | 'score') => {
    if (sortConfig.key !== key) {
        return null;
    }
    const icon = sortConfig.direction === 'ascending' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/>
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
    );
        
    return <span className="sort-indicator" aria-hidden="true">{icon}</span>;
  };

  const displayCandidates = useMemo(() => {
    let filteredItems = [...candidates];

    if (activeFilter !== 'All') {
        filteredItems = filteredItems.filter(candidate => candidate.status === activeFilter);
    }
    
    if (searchQuery) {
        filteredItems = filteredItems.filter(candidate => 
            candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    filteredItems.sort((a, b) => {
        const key = sortConfig.key;
        let valA, valB;

        if (key === 'score') {
            valA = a.interviewHistory[0]?.score ?? -1;
            valB = b.interviewHistory[0]?.score ?? -1;
        } else {
            valA = a[key];
            valB = b[key];
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    return filteredItems;
  }, [candidates, activeFilter, sortConfig, searchQuery]);
  
  const handleExportCSV = () => {
    if (displayCandidates.length === 0) {
        alert("No candidates to export based on current filters.");
        return;
    }

    const headers = ['ID', 'Name', 'Email', 'Status', 'Latest Score'];
    const csvRows = [headers.join(',')];

    for (const candidate of displayCandidates) {
        const latestScore = candidate.interviewHistory[0]?.score ?? 'N/A';
        // Basic CSV escaping for name and email
        const escapedName = `"${candidate.name.replace(/"/g, '""')}"`;
        const escapedEmail = `"${candidate.email.replace(/"/g, '""')}"`;

        const row = [
            candidate.id,
            escapedName,
            escapedEmail,
            `"${candidate.status.replace(/"/g, '""')}"`,
            latestScore
        ].join(',');
        csvRows.push(row);
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `candidates_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="candidate-management-panel">
      <header className="page-header">
        <h2>Candidate Management</h2>
      </header>
      
      <section className="cm-section" aria-labelledby="invite-heading">
        <h3 id="invite-heading">Invite a Candidate</h3>
        <form onSubmit={handleInvite} className="invite-form">
          <div className="invite-form-fields">
            <div className="form-field-group">
              <label htmlFor="invite-name">Candidate Name (Optional)</label>
              <input 
                type="text" 
                id="invite-name"
                placeholder="e.g., Jane Doe" 
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                disabled={isInviting}
              />
            </div>
            <div className="form-field-group">
              <label htmlFor="invite-email">Candidate Email</label>
              <input 
                type="email" 
                id="invite-email"
                placeholder="Enter candidate's email address" 
                value={newCandidateEmail}
                onChange={(e) => { setNewCandidateEmail(e.target.value); setError(null); }}
                required
                disabled={isInviting}
              />
            </div>
          </div>
          <button type="submit" disabled={isInviting}>
            {isInviting ? <span className="spinner" aria-label="Sending invite"></span> : 'Send Invite'}
          </button>
        </form>
        {error && error.field === 'invite' && <div className="error-display" role="alert">{error.message}</div>}
      </section>

      <section className="cm-section" aria-labelledby="bulk-invite-heading">
        <h3 id="bulk-invite-heading">Bulk Invite Candidates</h3>
        <form onSubmit={handleBulkInviteSubmit}>
          <div className="bulk-invite-options">
            <div className="bulk-option">
              <label htmlFor="bulk-emails">Paste Emails</label>
              <textarea
                id="bulk-emails"
                value={bulkEmails}
                onChange={(e) => { 
                    setBulkEmails(e.target.value); 
                    setError(null); 
                    setBulkInviteFeedback([]); 
                    setCsvFile(null); 
                    setShowCsvPreview(false); 
                    if (fileInputRef.current) fileInputRef.current.value = ''; 
                }}
                placeholder="john@example.com, jane@example.com"
                rows={5}
                className="bulk-invite-textarea"
                disabled={isBulkInviting || showCsvPreview}
                aria-describedby="bulk-format-instructions"
              ></textarea>
               <p id="bulk-format-instructions" className="sr-only">Enter multiple emails separated by commas, spaces, or new lines.</p>
               <button 
                    type="submit" 
                    className="bulk-invite-button" 
                    disabled={isBulkInviting || showCsvPreview || !bulkEmails.trim()}
                    style={{marginTop: '1.5rem'}} // Add some spacing for clarity
                >
                    {isBulkInviting ? <span className="spinner" aria-label="Sending invites"></span> : `Send ${bulkEmails.split(/[,\s\n;]+/).filter(e => e.trim()).length || 'Bulk'} Invites`}
                </button>
            </div>
            <div className="divider-or" aria-hidden="true">OR</div>
            <div className="bulk-option">
              <label htmlFor="csv-upload">Upload a CSV</label>
              <p className="upload-instructions" id="csv-instructions">Upload a single-column CSV file of email addresses.</p>
              <input 
                type="file" 
                id="csv-upload" 
                className="file-upload-input"
                accept=".csv, text/csv"
                ref={fileInputRef}
                onChange={handleCsvUploadChange}
                disabled={isBulkInviting || !!bulkEmails.trim() || showCsvPreview}
                aria-describedby="csv-instructions"
              />
              <label htmlFor="csv-upload" className={`file-upload-label ${(isBulkInviting || !!bulkEmails.trim() || showCsvPreview) ? 'disabled' : ''}`}>
                Choose File {csvFile && `(${csvFile.name})`}
              </label>
            </div>
          </div>
        </form>
        {error && error.field === 'bulk' && <div className="error-display" role="alert">{error.message}</div>}
        {bulkInviteFeedback.length > 0 && (
            <div className="bulk-feedback-container" role="status" aria-live="polite">
                {bulkInviteFeedback.map((feedback, index) => (
                    <div key={index} className={`bulk-feedback-message ${feedback.type}`}>
                        {feedback.message}
                    </div>
                ))}
            </div>
        )}

        {showCsvPreview && (
            <div className="csv-preview-overlay" role="dialog" aria-modal="true" aria-labelledby="csv-preview-title">
                <div className="csv-preview-modal">
                    <h3 id="csv-preview-title">Review Emails from CSV ({csvPreviewEmails.length} total)</h3>
                    <p>Please review the list of emails parsed from your CSV file. Confirm to send invites or cancel to make changes.</p>
                    <div className="preview-email-list">
                        {csvPreviewEmails.map((email, index) => (
                            <span key={index} className="preview-email-item">{email}</span>
                        ))}
                    </div>
                    <div className="csv-preview-actions">
                        <button onClick={handleConfirmCsvInvite} className="bulk-invite-button" disabled={isBulkInviting}>
                            {isBulkInviting ? <span className="spinner"></span> : `Confirm ${csvPreviewEmails.length} Invites`}
                        </button>
                        <button onClick={handleCancelCsvPreview} className="cancel-button" disabled={isBulkInviting}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
      </section>

      <section className="cm-section" aria-labelledby="candidate-list-heading">
        <h3 id="candidate-list-heading">Candidate List</h3>
        <div className="filter-controls">
            <div className="filter-dropdown-container">
                <label htmlFor="status-filter">Filter by Status:</label>
                <select 
                    id="status-filter"
                    className="status-filter-dropdown" 
                    value={activeFilter} 
                    onChange={(e) => setActiveFilter(e.target.value)}
                >
                    {filterOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>
            <div className="actions-container">
                <button onClick={handleExportCSV} className="export-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                    Export CSV
                </button>
                <div className="search-bar-container">
                    <label htmlFor="candidate-search" className="sr-only">Search Candidates</label>
                    <input
                        type="text"
                        id="candidate-search"
                        placeholder="Search by name or email..."
                        className="candidate-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </div>

        <div className="candidate-list-container">
          <div className="list-header" role="rowgroup">
            <div className="header-item" role="columnheader">
                <button className="sortable-header" onClick={() => requestSort('email')}>
                    Email {getSortIndicator('email')}
                </button>
            </div>
            <div className="header-item" role="columnheader">Name</div>
            <div className="header-item col-score" role="columnheader">
                 <button className="sortable-header col-score" onClick={() => requestSort('score')}>
                    Latest Score {getSortIndicator('score')}
                </button>
            </div>
            <div className="header-item col-status" role="columnheader">
                <button className="sortable-header col-status" onClick={() => requestSort('status')}>
                    Status {getSortIndicator('status')}
                </button>
            </div>
            <div className="header-item col-actions" role="columnheader">Actions</div>
          </div>
          <div className="list-body" role="rowgroup">
            {displayCandidates.length > 0 ? (
                displayCandidates.map(candidate => {
                    const progressProps = getProgressProps(candidate.status);
                    const latestScore = candidate.interviewHistory.length > 0 ? candidate.interviewHistory[0].score : null;
                    const displayScore = latestScore !== null ? `${latestScore}%` : 'N/A';

                    return (
                        <button key={candidate.id} className="candidate-item" onClick={() => navigate(`#/candidates/${candidate.id}`)} role="row">
                            <div className="col-email" role="cell">{candidate.email}</div>
                            <div className="col-name" role="cell">{candidate.name}</div>
                            <div className="col-score" role="cell">{displayScore}</div>
                            <div className="col-status" role="cell">
                                <span className={`status-badge ${getStatusClass(candidate.status)}`}>
                                    {candidate.status}
                                </span>
                            </div>
                            <div className="col-actions" role="cell">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCandidateClick(candidate.id); }} 
                                    className="delete-button"
                                    aria-label={`Delete candidate ${candidate.name}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                            </div>
                        </button>
                    );
                })
            ) : (
                <div className="no-candidates-found">No candidates found matching your criteria.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};