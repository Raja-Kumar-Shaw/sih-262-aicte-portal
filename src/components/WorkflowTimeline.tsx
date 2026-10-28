import React from 'react';
import { Clock, CheckCircle2, User, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface WorkflowTimelineProps {
  history: any[];
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No historical transitions recorded yet.</div>;
  }

  return (
    <div className="timeline-container">
      {history.map((item, idx) => (
        <div key={item.id || idx} className="timeline-item">
          <div className="timeline-node" />
          <div className="timeline-content">
            <div className="timeline-header">
              <span className="timeline-title">{item.action}</span>
              <span>{new Date(item.timestamp).toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
              <StatusBadge stageOrStatus={item.fromStage} />
              <ArrowRight size={13} color="var(--text-muted)" />
              <StatusBadge stageOrStatus={item.toStage} />
            </div>

            <div className="timeline-actor">
              <User size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
              <span>{item.performedByName}</span>
              <span style={{ margin: '0 4px' }}>•</span>
              <strong style={{ color: 'var(--aicte-navy)' }}>{item.performedByRole}</strong>
            </div>

            {item.comments && (
              <div className="timeline-comment">
                "{item.comments}"
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
