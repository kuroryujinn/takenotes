import React from 'react';
import type { ActivityEvent } from '../types/note';

interface ActivityFeedProps {
  events: ActivityEvent[];
  isLoading: boolean;
}

function formatTimestamp(unixTimestamp: number): string {
  if (!unixTimestamp) {
    return 'Unknown timestamp';
  }

  return new Date(unixTimestamp * 1000).toLocaleString();
}

export default function ActivityFeed({ events, isLoading }: ActivityFeedProps) {
  return (
    <section className="panel feed-panel">
      <h2>Activity Feed</h2>
      {isLoading ? <p className="muted">Loading activity events...</p> : null}
      {!isLoading && events.length === 0 ? (
        <p className="muted">No activity events yet. Create or update a note to populate this feed.</p>
      ) : null}

      <ul className="feed-list">
        {events.slice(0, 12).map((event, index) => (
          <li key={`${event.timestamp}-${event.noteId}-${index}`} className="feed-item">
            <p>
              <strong>{event.action || 'Note Action'}</strong> on note #{event.noteId}
            </p>
            <small>{formatTimestamp(event.timestamp)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
