import { PlusOutlined } from '@ant-design/icons';

function EmptyState({ icon, title, description, onAction, actionLabel }) {
  return (
    <div className="empty-state-rich">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-desc">{description}</p>}
      {onAction && actionLabel && (
        <button className="btn-primary" onClick={onAction} style={{ marginTop: 4 }}>
          <PlusOutlined /> {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
