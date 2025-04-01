import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/start.css';

// Remove the API_BASE_URL constant since we'll use relative URLs
// const API_BASE_URL = 'http://localhost:8000/api';

const Start = () => {
  // State variables
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Track voted questions in local storage
  const [votedQuestions, setVotedQuestions] = useState(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('votedQuestions');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Form state for adding new questions
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    answer: '',
    tagId: ''
  });
  
  // Show/hide new question form
  const [showAddForm, setShowAddForm] = useState(false);

  // Save voted questions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('votedQuestions', JSON.stringify(votedQuestions));
  }, [votedQuestions]);

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
      const response = await axios.get(`/api/tags`);
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
      const response = await axios.get(`/api/questions/tag/slug/${tagSlug}`);
      setQuestions(response.data.questions);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions for this tag.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has already voted on a question
  const hasVoted = (questionId) => {
    return votedQuestions[questionId] !== undefined;
  };

  // Get the vote type the user made on a question
  const getUserVoteType = (questionId) => {
    return votedQuestions[questionId] || null;
  };

  // Handle voting
  const handleVote = async (questionId, voteType) => {
    // If user already voted with this vote type, undo the vote
    if (hasVoted(questionId) && getUserVoteType(questionId) === voteType) {
      try {
        // Find the question to update locally
        const questionToUpdate = questions.find(q => q.id === questionId);
        if (!questionToUpdate) return;
        
        // Create a copy with updated vote count
        const updatedQuestion = { ...questionToUpdate };
        
        // Decrement the appropriate vote count
        if (voteType === 'up') {
          updatedQuestion.votesUp = Math.max(0, updatedQuestion.votesUp - 1);
        } else {
          updatedQuestion.votesDown = Math.max(0, updatedQuestion.votesDown - 1);
        }
        
        // Update questions array
        setQuestions(questions.map(q => 
          q.id === questionId ? updatedQuestion : q
        ));
        
        // Remove the vote from votedQuestions
        const newVotedQuestions = { ...votedQuestions };
        delete newVotedQuestions[questionId];
        setVotedQuestions(newVotedQuestions);
        
        // Note: In a real app, you would make an API call to undo the vote on the server
        // await axios.put(`/api/questions/${questionId}/unvote`, { voteType });
        
        return;
      } catch (err) {
        console.error('Error undoing vote:', err);
        setError('Failed to undo your vote. Please try again.');
        return;
      }
    }
    
    // If user already voted with a different vote type, show error
    if (hasVoted(questionId) && getUserVoteType(questionId) !== voteType) {
      setError('You can only vote once per question. Click your previous vote to undo it first.');
      return;
    }

    try {
      // Find the question to update locally
      const questionToUpdate = questions.find(q => q.id === questionId);
      if (!questionToUpdate) return;
      
      // Create a copy with updated vote count
      const updatedQuestion = { ...questionToUpdate };
      
      // Increment the appropriate vote count
      if (voteType === 'up') {
        updatedQuestion.votesUp += 1;
      } else {
        updatedQuestion.votesDown += 1;
      }
      
      // Update questions array immediately for better UX
      setQuestions(questions.map(q => 
        q.id === questionId ? updatedQuestion : q
      ));
      
      // Record that the user has voted on this question
      setVotedQuestions({
        ...votedQuestions,
        [questionId]: voteType
      });
      
      // Make the API call to update the server
      await axios.put(`/api/questions/${questionId}/vote`, {
        voteType: voteType
      });
      
    } catch (err) {
      console.error('Error voting on question:', err);
      setError('Failed to register your vote. Please try again.');
      
      // Revert the optimistic update if the API call fails
      fetchQuestionsByTag(selectedTag.slug);
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
      const response = await axios.post(`/api/questions`, newQuestion);
      
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

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
                        className={`vote-button upvote ${getUserVoteType(question.id) === 'up' ? 'user-voted' : ''}`}
                        onClick={() => handleVote(question.id, 'up')}
                        title={getUserVoteType(question.id) === 'up' ? "Click to undo your upvote" : "Vote up"}
                      >
                        👍 {question.votesUp}
                      </button>
                      <button 
                        className={`vote-button downvote ${getUserVoteType(question.id) === 'down' ? 'user-voted' : ''}`}
                        onClick={() => handleVote(question.id, 'down')}
                        title={getUserVoteType(question.id) === 'down' ? "Click to undo your downvote" : "Vote down"}
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