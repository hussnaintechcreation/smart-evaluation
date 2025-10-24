import React from 'react';
import './OrganizationSelector.css';

const organizations = [
  { id: 'org1', name: 'Innovate Inc.', logo: 'data:image/svg+xml,...' },
  { id: 'org2', name: 'Tech Solutions LLC', logo: 'data:image/svg+xml,...' },
  { id: 'org3', name: 'QuantumLeap Co.', logo: 'data:image/svg+xml,...' },
];

export const OrganizationSelector = ({ onSelectOrganization }) => {
  return (
    <div className="organization-selector-container">
      <div className="organization-selector-box">
        <header className="organization-selector-header">
          <div className="logo"></div>
          <h2>Select an Organization</h2>
          <p>Choose which organization's pipeline you want to manage.</p>
        </header>
        <div className="organization-list">
          {organizations.map(org => (
            <button 
              key={org.id} 
              className="organization-card"
              onClick={() => onSelectOrganization(org.name)}
            >
              <h3>{org.name}</h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
