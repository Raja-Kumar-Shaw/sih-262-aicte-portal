import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  HelpCircle, 
  XCircle, 
  PauseCircle, 
  Send 
} from 'lucide-react';

interface StatusBadgeProps {
  stageOrStatus: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ stageOrStatus }) => {
  const getBadgeConfig = () => {
    switch (stageOrStatus) {
      case 'APPROVED':
      case 'AUTOMATED_PASS':
      case 'VERIFIED':
      case 'RESOLVED':
        return {
          className: 'badge badge-success',
          icon: <CheckCircle2 size={12} />,
          label: stageOrStatus.replace(/_/g, ' ')
        };

      case 'REJECTED':
      case 'AUTOMATED_FAIL':
      case 'CRITICAL_OVERDUE':
        return {
          className: 'badge badge-critical',
          icon: <XCircle size={12} />,
          label: stageOrStatus.replace(/_/g, ' ')
        };

      case 'CLARIFICATION_REQUESTED':
      case 'CLARIFICATION_PENDING':
      case 'NEEDS_REVIEW':
      case 'NEAR_DEADLINE':
      case 'WARNING':
        return {
          className: 'badge badge-warning',
          icon: <AlertCircle size={12} />,
          label: stageOrStatus.replace(/_/g, ' ')
        };

      case 'UNDER_SCRUTINY':
      case 'SCRUTINY_ASSIGNED':
      case 'PRELIMINARY_SCRUTINY':
      case 'TECHNICAL_REVIEW':
      case 'OVERRIDDEN':
        return {
          className: 'badge badge-info',
          icon: <Clock size={12} />,
          label: stageOrStatus.replace(/_/g, ' ')
        };

      case 'SUBMITTED':
      case 'CLARIFICATION_SUBMITTED':
        return {
          className: 'badge badge-info',
          icon: <Send size={12} />,
          label: stageOrStatus.replace(/_/g, ' ')
        };

      case 'ON_HOLD':
        return {
          className: 'badge badge-neutral',
          icon: <PauseCircle size={12} />,
          label: 'ON HOLD'
        };

      case 'DRAFT':
      default:
        return {
          className: 'badge badge-neutral',
          icon: <FileCheck size={12} />,
          label: stageOrStatus.replace(/_/g, ' ')
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={config.className}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
