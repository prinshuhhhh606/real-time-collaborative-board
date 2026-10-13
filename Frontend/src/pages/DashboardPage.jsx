
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BoardService } from '../services/boardService';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load boards from the backend.
  const loadBoards = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await BoardService.listBoards();
      setBoards(response.boards || []);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load groups.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  // Search and sort groups dynamically.
  const filteredBoards = useMemo(() => {
    const result = boards.filter((board) =>
      (board.title || '')
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    );

    return [...result].sort((a, b) => {
      if (sortBy === 'az') {
        return (a.title || '').localeCompare(b.title || '');
      }

      if (sortBy === 'za') {
        return (b.title || '').localeCompare(a.title || '');
      }

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return sortBy === 'oldest'
        ? dateA - dateB
        : dateB - dateA;
    });
  }, [boards, search, sortBy]);

  // Create a group (currently represented by a board).
  const handleCreateGroup = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const groupTitle = title.trim();

    if (!groupTitle) {
      setError('Please enter a group name.');
      return;
    }

    const emails = [
      ...new Set(
        memberEmails
          .split(/[,;\n]+/)
          .map((email) => email.trim())
          .filter(Boolean)
      ),
    ];

    const invalidEmail = emails.find(
      (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

    if (invalidEmail) {
      setError(`Please check this email address: ${invalidEmail}`);
      return;
    }

    try {
      setCreating(true);

      const response = await BoardService.createBoard({
        title: groupTitle,
      });

      const newBoard = response.board;

      if (!newBoard) {
        throw new Error('The server did not return the created group.');
      }

      setBoards((current) => [
        newBoard,
        ...current.filter((board) => board._id !== newBoard._id),
      ]);

      setTitle('');
      setMemberEmails('');

      if (emails.length > 0) {
        if (typeof BoardService.addMember !== 'function') {
          setSuccess(`"${groupTitle}" was created successfully.`);
          setError(
            'Invitations are not configured yet. Add the addMember method to boardService.js and configure the backend API.'
          );
          return;
        }

        const results = await Promise.allSettled(
          emails.map((email) =>
            BoardService.addMember(newBoard._id, { email })
          )
        );

        const failedCount = results.filter(
          (result) => result.status === 'rejected'
        ).length;

        if (failedCount > 0) {
          setSuccess(`"${groupTitle}" was created successfully.`);
          setError(
            `${failedCount} invitation(s) could not be processed. Check your backend API and email addresses.`
          );
        } else {
          setSuccess(
            `"${groupTitle}" was created and all member requests succeeded.`
          );
        }

        await loadBoards();
      } else {
        setSuccess(`"${groupTitle}" was created successfully.`);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not create group.'
      );
    } finally {
      setCreating(false);
    }
  };

  const groupCount = boards.length;

  const memberCount = boards.reduce(
    (total, board) => total + (board.members?.length ?? 0),
    0
  );

  const getInitial = (name) =>
    (name || 'U').trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="app-shell dashboard-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">K</span>
          <div>
            <strong>Kanban Workspace</strong>
            <small>{user?.name || 'Team member'}</small>
          </div>
        </div>

        <button
          type="button"
          className="primary-btn full-width"
          onClick={() => navigate('/')}
        >
          <span>▦</span> Dashboard
        </button>

        <div className="sidebar-section">
          <h4>MY GROUPS</h4>

          <div className="sidebar-board-list">
            {boards.map((board) => (
              <button
                type="button"
                key={board._id}
                className="board-link"
                onClick={() => navigate(`/boards/${board._id}`)}
              >
                <span>▦</span>
                <span className="board-link-title">{board.title}</span>
              </button>
            ))}

            {!loading && boards.length === 0 && (
              <p className="sidebar-empty">No groups yet</p>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">
              {getInitial(user?.name)}
            </div>
            <div className="sidebar-user-details">
              <strong>{user?.name || 'User'}</strong>
              <small>Workspace member</small>
            </div>
          </div>

          <button
            type="button"
            className="ghost-btn full-width"
            onClick={logout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="page-header">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>Dashboard</h1>
            <p className="dashboard-subtitle">
              Manage your groups, organize tasks, and collaborate with your team.
            </p>
          </div>

          <div className="user-chip">
            <div className="avatar">
              {getInitial(user?.name)}
            </div>
            <div className="user-chip-details">
              <strong>{user?.name || 'User'}</strong>
              <small>Workspace member</small>
            </div>
          </div>
        </header>

        {/* Dynamic statistics */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple-icon">▦</div>
            <div>
              <p>Total Groups</p>
              <h2>{loading ? '—' : groupCount}</h2>
              <span className="stat-caption">Your workspaces</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue-icon">✓</div>
            <div>
              <p>Total Boards</p>
              <h2>{loading ? '—' : boards.length}</h2>
              <span className="stat-caption">Available boards</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange-icon">♙</div>
            <div>
              <p>Memberships</p>
              <h2>{loading ? '—' : memberCount}</h2>
              <span className="stat-caption">Membership records</span>
            </div>
          </div>
        </section>

        {/* Create group form */}
        <section className="create-board-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">GET STARTED</p>
              <h3>Create a group</h3>
              <p>
                Set up a workspace for your next project.
              </p>
            </div>

            <div className="create-icon">＋</div>
          </div>

          <form onSubmit={handleCreateGroup} className="group-form">
            <label htmlFor="group-title">Group name</label>
            <input
              id="group-title"
              type="text"
              value={title}
              placeholder="e.g. Website Redesign Team"
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              required
              disabled={creating}
            />

            <label htmlFor="member-emails">
              Invite members <span>(optional)</span>
            </label>

            <textarea
              id="member-emails"
              value={memberEmails}
              placeholder="alex@example.com, sam@example.com"
              onChange={(event) => setMemberEmails(event.target.value)}
              rows={3}
              disabled={creating}
            />

            <p className="input-hint">
              Enter email addresses separated by commas, semicolons, or new lines.
            </p>

            <button
              type="submit"
              className="primary-btn create-group-btn"
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="button-spinner" />
                  Creating group...
                </>
              ) : (
                '+ Create Group'
              )}
            </button>
          </form>
        </section>

        {/* Status messages */}
        {error && (
          <div className="form-error" role="alert">
            <span>⚠</span>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="success-message" role="status">
            <span>✓</span>
            <p>{success}</p>
            <button
              type="button"
              onClick={() => setSuccess('')}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Groups list */}
        <section className="groups-section">
          <div className="groups-heading">
            <div>
              <p className="eyebrow">YOUR WORKSPACES</p>
              <h2>My Groups</h2>
            </div>

            <span className="group-count">
              {loading
                ? 'Loading...'
                : `${filteredBoards.length} of ${groupCount} groups`}
            </span>
          </div>

          {/* Search, sort and refresh */}
          <div className="board-toolbar">
            <div className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search your groups..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search groups"
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort groups"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">Name: A–Z</option>
              <option value="za">Name: Z–A</option>
            </select>

            <button
              type="button"
              className="refresh-btn"
              onClick={loadBoards}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="loader">
              <span className="loading-spinner" />
              <p>Loading your groups...</p>
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {search ? '⌕' : '▦'}
              </div>

              <h3>
                {search
                  ? 'No matching groups'
                  : 'Your workspace starts here'}
              </h3>

              <p>
                {search
                  ? 'Try another group name or clear your search.'
                  : 'Create your first group and invite teammates to collaborate.'}
              </p>

              {search && (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setSearch('')}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="board-grid">
              {filteredBoards.map((board, index) => (
                <article
                  key={board._id}
                  className="board-card"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/boards/${board._id}`)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/boards/${board._id}`);
                    }
                  }}
                >
                  <div className="board-card-top">
                    <div className={`group-card-icon icon-${index % 4}`}>
                      {getInitial(board.title)}
                    </div>
                    <span className="card-menu" aria-hidden="true">
                      ↗
                    </span>
                  </div>

                  <div className="board-card-header">
                    <h3>{board.title}</h3>
                  </div>

                  <p className="group-owner">
                    Owner: {board.createdBy?.name || 'Workspace owner'}
                  </p>

                  <div className="group-card-footer">
                    <span>
                      ♙ {board.members?.length ?? 0} members
                    </span>
                    <span className="open-group">
                      Open group →
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <span>Kanban Workspace</span>
          <span>Plan, organize, collaborate.</span>
        </footer>
      </main>
    </div>
  );
}
