/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import './CustomInterviewBuilder.css';

interface InterviewQuestion {
  question: string;
  category: string;
}

interface Template {
  id: number;
  jobTitle: string;
  jobDescription: string;
  timer: number;
  categories: string[];
  // FEAT: Add organization field to templates
  organization: string;
}

export const CustomInterviewBuilder = ({ templates, onSaveTemplate, onDeleteTemplate, organization }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [timer, setTimer] = useState(60); 
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [favoriteQuestions, setFavoriteQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<string[]>(['Technical', 'Behavioral', 'Situational']);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState('');
  const [animatedStar, setAnimatedStar] = useState<string | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const questionsInCategory = questions.filter(q => q.category === categoryToRemove);

    if (questionsInCategory.length > 0) {
        if (!window.confirm(`Are you sure you want to remove the "${categoryToRemove}" category? This will also remove ${questionsInCategory.length} generated question(s) in this category.`)) {
            return; // User cancelled the action
        }
    }

    // Filter out questions from the main list that belong to the removed category
    const updatedQuestions = questions.filter(q => q.category !== categoryToRemove);
    setQuestions(updatedQuestions);
    
    // Also filter out questions from the favorites list
    const updatedFavorites = favoriteQuestions.filter(q => q.category !== categoryToRemove);
    setFavoriteQuestions(updatedFavorites);

    // Filter out the category itself from the categories list
    const updatedCategories = categories.filter(category => category !== categoryToRemove);
    setCategories(updatedCategories);
    
    // If the currently selected filter is the category being removed, reset it to 'All'
    if (selectedCategory === categoryToRemove) {
        setSelectedCategory('All');
    }

    setToastMessage(`Category "${categoryToRemove}" and associated questions removed.`);
  };


  const generateImage = async () => {
    if (!jobTitle.trim()) {
        setError('Please provide a job title to generate a relevant image.');
        return;
    }
    setIsImageLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const prompt = `A professional, abstract, high-tech, minimalist placeholder image for an interview about the role: "${jobTitle}". The theme should be related to AI and technology. Blue and teal color palette. Aspect ratio 16:9.`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });
        
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        setGeneratedImage(imageUrl);
        setUploadedImage(null); // Clear uploaded image

    } catch (e) {
        console.error(e);
        setError('Failed to generate image. The AI model might be busy, please try again.');
    } finally {
        setIsImageLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            setError('Invalid file type. Please upload a JPG, PNG, or GIF.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError('File is too large. Please upload an image smaller than 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedImage(reader.result as string);
            setGeneratedImage(null);
            setError('');
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
  };


  const generateQuestions = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError('Please provide both a job title and a description.');
      return;
    }
    if (categories.length === 0) {
      setError('Please add at least one question category.');
      return;
    }

    setIsLoading(true);
    setError('');
    setQuestions([]);
    setFavoriteQuestions([]);
    setSelectedCategory('All');

    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const prompt = `Generate 5 interview questions for a "${jobTitle}" role. Job description: "${jobDescription}". The questions must belong to one of the following categories: ${categories.join(', ')}. Ensure a good mix of questions across these categories.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: 'A list of interview questions.',
            items: {
              type: Type.OBJECT,
              properties: {
                question: {
                  type: Type.STRING,
                  description: 'The interview question text.',
                },
                category: {
                  type: Type.STRING,
                  description: `The category of the question. Must be one of: ${categories.join(', ')}.`,
                },
              },
              required: ['question', 'category'],
            },
          },
        },
      });
      
      const jsonStr = response.text.trim();
      const generatedQuestions = JSON.parse(jsonStr);
      setQuestions(generatedQuestions);

    } catch (e) {
      console.error(e);
      setError('Failed to generate questions. The AI model might be busy, please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFavorite = (question: InterviewQuestion) => {
    return favoriteQuestions.some(fav => fav.question === question.question);
  };

  const toggleFavorite = (question: InterviewQuestion) => {
    if (isFavorite(question)) {
      setFavoriteQuestions(favoriteQuestions.filter(fav => fav.question !== question.question));
      setToastMessage('Removed from favorites');
    } else {
      setFavoriteQuestions([...favoriteQuestions, question]);
      setToastMessage('Added to favorites');
      setAnimatedStar(question.question);
      setTimeout(() => setAnimatedStar(null), 500); // Duration of animation
    }
  };

  const handleSaveNewTemplate = () => {
    if (!jobTitle.trim()) {
        setToastMessage('Please enter a job title before saving a template.');
        return;
    }

    // FEAT: Check for duplicates only within the current organization's templates
    const isDuplicate = templates
        .filter(t => t.organization === organization)
        .some(t => t.jobTitle.trim().toLowerCase() === jobTitle.trim().toLowerCase());

    if (isDuplicate) {
        if (!window.confirm(`A template with the name "${jobTitle}" already exists for ${organization}. Do you want to save a new one anyway?`)) {
            return;
        }
    }

    const newTemplate: Template = {
      id: Date.now(),
      jobTitle,
      jobDescription,
      timer,
      categories,
      organization, // Save the current organization with the template
    };
    onSaveTemplate(newTemplate);
    setToastMessage(`Template "${jobTitle}" saved successfully!`);
  };

  const handleLoadTemplate = (templateId: number) => {
    const templateToLoad = templates.find(t => t.id === templateId);
    if (templateToLoad) {
        setJobTitle(templateToLoad.jobTitle);
        setJobDescription(templateToLoad.jobDescription);
        setTimer(templateToLoad.timer);
        setCategories(templateToLoad.categories);
        setQuestions([]);
        setFavoriteQuestions([]);
        setGeneratedImage(null);
        setUploadedImage(null);
        setSelectedCategory('All');
        setToastMessage(`Template "${templateToLoad.jobTitle}" loaded.`);
    }
  };

  const handleDeleteTemplateClick = (templateId: number) => {
    if (window.confirm("Are you sure you want to delete this template? This cannot be undone.")) {
        onDeleteTemplate(templateId);
        setToastMessage('Template deleted.');
    }
  };

  const filteredQuestions = questions.filter(q => selectedCategory === 'All' || q.category === selectedCategory);

  // FEAT: Filter templates by the current organization and search query
  const filteredTemplates = templates.filter(template =>
    template.organization === organization &&
    template.jobTitle.toLowerCase().includes(templateSearchQuery.toLowerCase())
  );

  return (
    <div className="custom-interview-builder-panel">
      <header className="page-header">
        <h2>Custom Interview Builder</h2>
      </header>

      {/* FEAT: Show template section only if there are templates for the current organization */}
      {templates.filter(t => t.organization === organization).length > 0 && (
        <section className="cib-section">
            <h3>Load a Saved Template for {organization}</h3>
            <div className="template-search-container">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" className="search-icon" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
                <input
                    type="text"
                    placeholder="Search templates by job title..."
                    className="template-search-bar"
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                />
            </div>
            {filteredTemplates.length > 0 ? (
                <div className="template-list">
                    {filteredTemplates.map(template => (
                        <div key={template.id} className="template-card">
                            <h4>{template.jobTitle}</h4>
                            <div className="template-icons">
                                {template.jobDescription && (
                                    <span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>
                                        Description
                                    </span>
                                )}
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M19.4 12c0-.2.1-.4.1-.6s0-.4-.1-.6l2.1-1.7c.2-.1.2-.4.1-.6l-2-3.5c-.1-.2-.4-.2-.6-.1l-2.5 1c-.5-.4-1-.7-1.5-1l-.4-2.7c0-.2-.2-.4-.4-.4h-4c-.2 0-.4.2-.4.4l-.4 2.7c-.5.3-1 .6-1.5 1l-2.5-1c-.2-.1-.5-.1-.6.1l-2 3.5c-.1.2-.1.5.1.6l2.1 1.7c-.1.2-.1.4-.1.6s0 .4.1.6l-2.1 1.7c-.2.1-.2.4-.1.6l2 3.5c.1.2.4.2.6.1l2.5-1c.5.4 1 .7 1.5 1l.4 2.7c0 .2.2.4.4.4h4c.2 0 .4-.2.4.4l.4-2.7c.5-.3 1-.6 1.5-1l2.5 1c.2.1.5.1.6-.1l2-3.5c.1-.2.1-.5-.1-.6l-2.1-1.7zm-7.4 2.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"></path></svg>
                                    {template.timer}s Timer
                                </span>
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.22-1.05-.59-1.42zM13 20.99l-9-9V4h7l9 9-7 7.01z"></path><circle cx="6.5" cy="6.5" r="1.5"></circle></svg>
                                    {template.categories.length} Categories
                                </span>
                            </div>
                            <div className="template-actions">
                                <button onClick={() => handleLoadTemplate(template.id)} className="template-button load">Load</button>
                                <button onClick={() => handleDeleteTemplateClick(template.id)} className="template-button delete">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-templates-found">No templates found matching your search for {organization}.</p>
            )}
        </section>
      )}

      <section className="cib-section">
        <h3>1. Define the Role & Settings</h3>
        <div className="form-grid">
            <div className="form-group">
                <label htmlFor="jobTitle">Job Title</label>
                <input
                    type="text"
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Frontend Developer"
                />
            </div>
            <div className="form-group">
                <label htmlFor="timer">Per-Question Timer (seconds)</label>
                <select id="timer" value={timer} onChange={(e) => setTimer(Number(e.target.value))}>
                    <option value={60}>60 seconds</option>
                    <option value={90}>90 seconds</option>
                    <option value={120}>120 seconds</option>
                    <option value={180}>180 seconds</option>
                </select>
            </div>
        </div>
        <div className="form-group">
            <label htmlFor="jobDescription">Job Description & Requirements</label>
            <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={5}
                placeholder="Paste the job description here to help the AI generate relevant questions..."
            ></textarea>
        </div>
        <button onClick={handleSaveNewTemplate} className="save-template-button">
          Save Configuration as Template
        </button>
      </section>

      <section className="cib-section">
        <h3>2. Define Question Categories</h3>
        <form onSubmit={handleAddCategory} className="category-form">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Add a new category (e.g., Cultural Fit)"
          />
          <button type="submit">Add</button>
        </form>
        <div className="category-list">
          {categories.map(category => (
            <div key={category} className="category-pill">
              {category}
              <button onClick={() => handleRemoveCategory(category)} aria-label={`Remove category ${category}`}>&times;</button>
            </div>
          ))}
        </div>
      </section>

      <section className="cib-section">
        <h3>3. Generate Questions & Interview Image</h3>
        <div className="generation-controls">
            <button onClick={generateQuestions} disabled={isLoading} className="generate-button">
                {isLoading && <span className="spinner"></span>}
                {isLoading ? 'Generating...' : 'Generate Questions'}
            </button>
            <button onClick={generateImage} disabled={isImageLoading} className="generate-button secondary">
                 {isImageLoading && <span className="spinner"></span>}
                Generate Header Image
            </button>
            <input
                type="file"
                id="imageUpload"
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
            />
            <label htmlFor="imageUpload" className="generate-button secondary">
                Upload Custom Image
            </label>
            {(uploadedImage || generatedImage) && (
                <button onClick={handleRemoveImage} className="generate-button danger">
                    Remove Image
                </button>
            )}
        </div>
        
        {isLoading && <p className="loading-message">AI is crafting your interview questions...</p>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="image-placeholder-container">
            {isImageLoading ? <span className="spinner"></span> :
             uploadedImage ? <img src={uploadedImage} alt="Uploaded for job role" className="generated-image" /> :
             generatedImage ? <img src={generatedImage} alt="Generated for job role" className="generated-image" /> :
             'Generated or uploaded header image will appear here'
            }
        </div>
      </section>

      {questions.length > 0 && (
        <section className="cib-section">
          <h3>4. Review & Refine Questions</h3>
          <div className="filter-controls">
            <p>Filter by category:</p>
            <div className="filter-buttons">
                <button 
                    className={`filter-button ${selectedCategory === 'All' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('All')}>
                    All
                </button>
                {[...new Set(questions.map(q => q.category))].map(category => (
                    <button 
                        key={category}
                        className={`filter-button ${selectedCategory === category ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(category)}>
                        {category}
                    </button>
                ))}
            </div>
          </div>

          <div className="questions-list">
            {filteredQuestions.map((q, index) => (
              <div key={index} className="question-card">
                 <button 
                    className={`favorite-toggle ${isFavorite(q) ? 'active' : ''} ${animatedStar === q.question ? 'animate-pop' : ''}`} 
                    onClick={() => toggleFavorite(q)}
                    aria-label={isFavorite(q) ? 'Remove from favorites' : 'Add to favorites'}
                >
                    ★
                </button>
                <div className="question-header">
                  <span className="question-category">{q.category}</span>
                  <span className="question-number">Question {index + 1}</span>
                </div>
                <p className="question-text">{q.question}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {favoriteQuestions.length > 0 && (
          <section className="cib-section favorites-container">
              <h3>Your Favorite Questions</h3>
              <div className="favorite-questions-list">
                  {favoriteQuestions.map((q, index) => (
                      <div key={index} className="favorite-item">
                          <p className="favorite-question-text">{q.question}</p>
                          <span className="question-category">{q.category}</span>
                          <button onClick={() => toggleFavorite(q)} className="remove-favorite-button">Remove</button>
                      </div>
                  ))}
              </div>
          </section>
      )}

      <div className={`toast-notification ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
};