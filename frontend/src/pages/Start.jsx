import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/start.css';

const API_BASE_URL = 'http://localhost:8080/api'; // Update with your actual API URL

const Start = () => {
  // State variables
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state for adding new questions
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    answer: '',
    tagId: ''
  });
  
  // Show/hide new question form
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch all tags when component mounts
  useEffect(() => {
    fetchTags();
  }, []);

  // Fetch questions when selected tag changes
  useEffect(() => {
    if (selectedTag) {
      fetchQuestionsByTag(selectedTag.slug);
    }
  }, [selectedTag]);

  // Fetch all tags
  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tags`);
      setTags(response.data.tags);
      // If tags exist, select the first one by default
      if (response.data.tags.length > 0) {
        setSelectedTag(response.data.tags[0]);
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError('Failed to load tags. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch questions by tag slug
  const fetchQuestionsByTag = async (tagSlug) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/questions/tag/slug/${tagSlug}`);
      setQuestions(response.data.questions);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions for this tag.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voting
  const handleVote = async (questionId, voteType) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/questions/${questionId}/vote`, {
        voteType: voteType
      });
      
      // Update the questions list with the updated question
      setQuestions(questions.map(q => 
        q.id === response.data.question.id ? response.data.question : q
      ));
    } catch (err) {
      console.error('Error voting on question:', err);
      setError('Failed to register your vote. Please try again.');
    }
  };

  // Handle adding a new question
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    
    if (!newQuestion.question || !newQuestion.answer || !newQuestion.tagId) {
      setError('Please fill out all required fields.');
      return;
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/questions`, newQuestion);
      
      // Add the new question to the list if we're viewing the same tag
      if (selectedTag && selectedTag.id.toString() === newQuestion.tagId) {
        setQuestions([...questions, response.data.question]);
      }
      
      // Reset the form
      setNewQuestion({
        question: '',
        answer: '',
        tagId: selectedTag ? selectedTag.id.toString() : ''
      });
      
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding question:', err);
      setError('Failed to add your question. Please check your inputs and try again.');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion({
      ...newQuestion,
      [name]: value
    });
  };

  // Handle tag selection
  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
    setNewQuestion({
      ...newQuestion,
      tagId: tag.id.toString()
    });
  };

  return (
    <div className="tech-interviewer-container">
      <h1 className="app-title">Tech Interviewer</h1>
      <p className="app-description">Find and share common technical interview questions</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="tags-container">
        <h2>Topics</h2>
        {isLoading && tags.length === 0 ? (
          <p>Loading tags...</p>
        ) : (
          <div className="tags-list">
            {tags.map(tag => (
              <button 
                key={tag.id} 
                className={`tag-button ${selectedTag && selectedTag.id === tag.id ? 'active' : ''}`}
                onClick={() => handleTagSelect(tag)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {selectedTag && (
        <div className="selected-tag-container">
          <div className="tag-header">
            <h2>{selectedTag.name}</h2>
            <p>{selectedTag.description}</p>
            <button 
              className="add-question-button"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : 'Add Question'}
            </button>
          </div>
          
          {showAddForm && (
            <div className="question-form-container">
              <h3>Add New Question</h3>
              <form onSubmit={handleAddQuestion}>
                <div className="form-group">
                  <label htmlFor="question">Question:</label>
                  <textarea
                    id="question"
                    name="question"
                    value={newQuestion.question}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="answer">Answer:</label>
                  <textarea
                    id="answer"
                    name="answer"
                    value={newQuestion.answer}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="tagId">Topic:</label>
                  <select
                    id="tagId"
                    name="tagId"
                    value={newQuestion.tagId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a topic</option>
                    {tags.map(tag => (
                      <option key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button type="submit" className="submit-button">Add Question</button>
              </form>
            </div>
          )}
          
          <div className="questions-container">
            <h3>Questions ({questions.length})</h3>
            {isLoading ? (
              <p>Loading questions...</p>
            ) : questions.length === 0 ? (
              <p>No questions found for this topic. Add the first one!</p>
            ) : (
              <div className="questions-list">
                {questions.map(question => (
                  <div key={question.id} className="question-card">
                    <div className="question-content">
                      <h4>{question.question}</h4>
                      <div className="answer-container">
                        <p>{question.answer}</p>
                      </div>
                    </div>
                    
                    <div className="voting-container">
                      <button 
                        className="vote-button upvote"
                        onClick={() => handleVote(question.id, 'up')}
                      >
                        👍 {question.votesUp}
                      </button>
                      <button 
                        className="vote-button downvote"
                        onClick={() => handleVote(question.id, 'down')}
                      >
                        👎 {question.votesDown}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Start;