import React from 'react';
import './AdminPanel.css';

const mockActivity = [
  { id: 1, type: 'review', description: 'Samantha Jones completed an interview for the Senior Frontend Developer role.', time: '1h ago' },
  { id: 2, type: 'approved', description: 'Alex Doe was approved.', time: '3h ago' },
  { id: 3, type: 'invite', description: 'Michael Chen was invited to interview.', time: '1d ago' },
  { id: 4, type: 'template', description: 'A new template "UX/UI Designer" was created.', time: '2d ago' },
  { id: 5, type: 'invite', description: 'Jessica Davis was invited to interview.', time: '2d ago' },
];

const pipelineColors: {[key: string]: string} = {
    pending: '#FFA726',
    review: '#26C6DA',
    approved: 'var(--primary-accent)'
};

const scoreDistributionRanges = [
    { range: '0-70%', min: 0, max: 70, color: '#e57373' },
    { range: '71-85%', min: 71, max: 85, color: '#ffc107' },
    { range: '86-95%', min: 86, max: 95, color: 'var(--primary-accent)' },
    { range: '96-100%', min: 96, max: 100, color: '#66bb6a' },
];


interface ChartCardProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

const ChartCard = ({ title, children, className = '' }: ChartCardProps) => (
    <div className={`chart-card ${className}`}>
        <h3>{title}</h3>
        {children}
    </div>
);

interface PipelineChartProps {
    data: { [key: string]: number };
}

const PipelineChart = ({ data }: PipelineChartProps) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    if (total === 0) {
        return <div className="chart-placeholder">No candidate data available.</div>;
    }
    
    let cumulativePercentage = 0;
    const gradientParts = Object.entries(data).map(([key, value]) => {
        const percentage = (value / total) * 100;
        const part = `${pipelineColors[key]} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`;
        cumulativePercentage += percentage;
        return part;
    });

    const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className="pipeline-chart-container">
            <div 
                className="donut-chart" 
                style={{ background: conicGradient }}
                role="img"
                aria-label={`Candidate pipeline status: ${data.pending || 0} pending, ${data.review || 0} awaiting review, ${data.approved || 0} approved.`}
            >
                <div className="donut-chart-center">
                    <span>{total}</span>
                    Total
                </div>
            </div>
            <div className="chart-legend">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="legend-item">
                        <div className="legend-color-dot" style={{ backgroundColor: pipelineColors[key] }}></div>
                        <span className="legend-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        <span className="legend-value">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface ScoreDistributionChartProps {
    data: { range: string; count: number; color: string }[];
}

const ScoreDistributionChart = ({ data }: ScoreDistributionChartProps) => {
    const totalScores = data.reduce((sum, bar) => sum + bar.count, 0);
    if (totalScores === 0) {
        return <div className="chart-placeholder">No completed interviews with scores.</div>;
    }

    const maxCount = Math.max(...data.map(d => d.count), 0) || 1;
    return (
        <div className="score-chart-container" role="figure" aria-label="A bar chart showing the distribution of candidate scores.">
            {data.map((bar, index) => (
                 <div key={index} className="bar-wrapper" role="group" aria-label={`${bar.range}: ${bar.count} candidates`}>
                    <div className="bar-tooltip">{bar.count}</div>
                    <div className="bar" style={{ height: `${(bar.count / maxCount) * 100}%`, backgroundColor: bar.color }}></div>
                    <div className="bar-label">{bar.range}</div>
                </div>
            ))}
        </div>
    );
};

export const AdminPanel = ({ candidates, templates }) => {

    // REFACTOR: Calculate analytics from live data
    const pipelineData = {
        pending: candidates.filter(c => c.status === 'Pending').length,
        review: candidates.filter(c => c.status === 'Awaiting Review').length,
        approved: candidates.filter(c => c.status === 'Approved').length
    };
    
    const scoreDistribution = scoreDistributionRanges.map(range => {
        const count = candidates.filter(c => {
            const latestScore = c.interviewHistory[0]?.score;
            return latestScore >= range.min && latestScore <= range.max;
        }).length;
        return { ...range, count };
    });

  return (
    <div className="admin-panel-container">
        <div className="admin-panel-content">
          <header className="page-header">
            <h2>Welcome, Admin!</h2>
            <p>Here's a quick overview of your platform's activity.</p>
          </header>
          <main className="dashboard-grid">
            <ChartCard title="Candidate Pipeline" className="large-card">
              <PipelineChart data={pipelineData} />
            </ChartCard>
            <ChartCard title="Interview Score Distribution" className="large-card">
              <ScoreDistributionChart data={scoreDistribution} />
            </ChartCard>
            <ChartCard title="Interview Templates" className="summary-card">
              <p className="summary-value">{templates.length}</p>
              <span className="summary-footer">Custom templates created</span>
            </ChartCard>
            <ChartCard title="Awaiting Review" className="summary-card">
              <p className="summary-value">{pipelineData.review}</p>
              <span className="summary-footer">Completed interviews to evaluate</span>
            </ChartCard>
          </main>
        </div>
        <aside className="recent-activity-sidebar">
          <h3>Recent Activity</h3>
          <div className="activity-feed">
            {mockActivity.map(item => (
              <div className="activity-item" key={item.id}>
                <div className={`activity-icon ${item.type}`}></div>
                <div className="activity-details">
                  <p>{item.description}</p>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
    </div>
  );
};