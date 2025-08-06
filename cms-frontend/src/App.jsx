/* === App.jsx === */
/* Replace the contents of src/App.jsx with this code */

import React, { useState, useEffect, useCallback } from 'react';
// Import Tiptap components
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import './App.css'; // Import the custom CSS file

// --- Configuration ---
const API_URL = 'http://localhost:3001/api';

// --- Main App Component ---
const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const authenticatedFetch = useCallback(async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }
        
        const response = await fetch(`${API_URL}${url}`, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            setToken(null);
            setError("Your session has expired. Please sign in again.");
        }
        
        return response;
    }, []);

    useEffect(() => {
        if (token) {
            setLoading(true);
            authenticatedFetch('/pages')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch pages.');
                    return res.json();
                })
                .then(data => setPages(data))
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        } else {
            setPages([]);
        }
    }, [token, authenticatedFetch]);

    const handleLoginSuccess = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setError('');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentPage(null);
    };

    const handleSavePage = async (pageToSave) => {
        const isUpdating = pageToSave.id;
        const url = isUpdating ? `/pages/${pageToSave.id}` : '/pages';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const response = await authenticatedFetch(url, {
                method: method,
                body: JSON.stringify(pageToSave),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to save page.');
            }
            const updatedPagesResponse = await authenticatedFetch('/pages');
            const updatedPages = await updatedPagesResponse.json();
            setPages(updatedPages);
            setCurrentPage(null);
        } catch (err) {
            setError(err.message);
        }
    };
    
    const handleDeletePage = async (pageId) => {
        if (window.confirm("Are you sure you want to delete this page?")) {
            try {
                const response = await authenticatedFetch(`/pages/${pageId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete page.');
                setPages(pages.filter(p => p.id !== pageId));
            } catch (err) {
                setError(err.message);
            }
        }
    };

    return (
        <div className="app-container">
            <Header isLoggedIn={!!token} onLogout={handleLogout} />
            <main className="main-content">
                {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
                
                {!token ? (
                    <AuthComponent onLoginSuccess={handleLoginSuccess} setError={setError} />
                ) : currentPage ? (
                    <PageEditor 
                        page={currentPage} 
                        onSave={handleSavePage} 
                        onBack={() => setCurrentPage(null)}
                    />
                ) : (
                    <PageList 
                        pages={pages}
                        loading={loading}
                        onSelectPage={setCurrentPage} 
                        onCreateNew={() => setCurrentPage({ title: '', content: ''})}
                        onDeletePage={handleDeletePage}
                    />
                )}
            </main>
            <Footer />
        </div>
    );
};

// --- Child Components ---

const Header = ({ isLoggedIn, onLogout }) => (
    <header className="header">
        <div className="header-content">
            <h1 className="header-title">Node.js/React CMS</h1>
            {isLoggedIn && (
                <button onClick={onLogout} className="btn btn-primary">
                    Sign Out
                </button>
            )}
        </div>
    </header>
);

const AuthComponent = ({ onLoginSuccess, setError }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const endpoint = isSignUp ? '/register' : '/login';
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'An error occurred.');
            if (isSignUp) {
                alert('Registration successful! Please sign in.');
                setIsSignUp(false);
            } else {
                onLoginSuccess(data.accessToken);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" required />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary form-full-width-btn">
                    {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
            </form>
            <p className="form-switch-text">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button onClick={() => setIsSignUp(!isSignUp)}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
            </p>
        </div>
    );
};

const PageList = ({ pages, loading, onSelectPage, onCreateNew, onDeletePage }) => (
    <div className="page-list-container">
        <div className="page-list-header">
            <h2 className="page-list-title">Your Pages</h2>
            <button onClick={onCreateNew} className="btn btn-primary">New Page</button>
        </div>
        {loading ? <p>Loading pages...</p> : (
            pages.length > 0 ? (
                <ul className="page-list">
                    {pages.map(page => (
                        <li key={page.id} className="page-list-item">
                            <span className="page-list-item-title">{page.title}</span>
                            <div className="page-list-item-actions">
                                <button onClick={() => onSelectPage(page)} className="btn btn-edit">Edit</button>
                                <button onClick={() => onDeletePage(page.id)} className="btn btn-danger">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : <p className="page-list-empty">No pages found. Create one!</p>
        )}
    </div>
);

// --- Tiptap Toolbar Component ---
const MenuBar = ({ editor }) => {
    if (!editor) {
      return null;
    }
  
    return (
      <div className="tiptap-toolbar">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>Bold</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>Italic</button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>Strike</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>List</button>
      </div>
    );
};

// --- UPDATED PageEditor Component with TipTap ---
const PageEditor = ({ page, onSave, onBack }) => {
    const [title, setTitle] = useState(page.title);

    const editor = useEditor({
        extensions: [StarterKit],
        content: page.content, // Set initial content
    });

    const handleSave = (e) => {
        e.preventDefault();
        // Get the HTML content from the editor
        const htmlContent = editor.getHTML();
        onSave({ ...page, title, content: htmlContent });
    };

    return (
        <div className="page-editor-container">
            <button onClick={onBack} className="page-editor-back-button">&larr; Back to list</button>
            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label className="form-label">Page Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                    <label className="form-label">Content</label>
                    <div className="tiptap-container">
                        <MenuBar editor={editor} />
                        <EditorContent editor={editor} />
                    </div>
                </div>
                <button type="submit" className="btn btn-success form-full-width-btn">Save Page</button>
            </form>
        </div>
    );
};

const ErrorMessage = ({ message, onDismiss }) => (
    <div className="error-message">
        <span>{message}</span>
        <button onClick={onDismiss}>&times;</button>
    </div>
);

const Footer = () => (
    <footer className="footer">
        <p>Simple CMS built with React and Node.js</p>
    </footer>
);

export default App;